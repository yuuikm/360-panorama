#!/bin/bash
set -e

# Copy .env if not exists
if [ ! -f /var/www/backend/.env ]; then
    cp /var/www/backend/.env.example /var/www/backend/.env
fi

# Ensure directories exist
mkdir -p /var/www/backend/storage/framework/sessions \
         /var/www/backend/storage/framework/views \
         /var/www/backend/storage/framework/cache \
         /var/www/backend/storage/app/public \
         /var/www/backend/bootstrap/cache

# Generate key if empty
if ! grep -q "APP_KEY=base64:" /var/www/backend/.env; then
    php artisan key:generate --force || true
fi

# Link storage (use relative symlink so it works both in container and on host)
if [ ! -L /var/www/backend/public/storage ]; then
    cd /var/www/backend/public && ln -s ../storage/app/public storage && cd /var/www/backend || true
fi

# Fix permissions
chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache
chmod -R 775 /var/www/backend/storage /var/www/backend/bootstrap/cache

# Wait for MySQL and run migrations
echo "Checking database connection..."
until php artisan db:monitor > /dev/null 2>&1 || php -r '
$h = getenv("DB_HOST") ?: "mysql";
$p = getenv("DB_PORT") ?: "3306";
$d = getenv("DB_DATABASE") ?: "panorama";
$u = getenv("DB_USERNAME") ?: "panorama_user";
$pw = getenv("DB_PASSWORD") ?: "secret";
try {
    new PDO("mysql:host=$h;port=$p;dbname=$d", $u, $pw);
    exit(0);
} catch (Exception $e) {
    exit(1);
}'; do
    echo "Waiting for database to become ready..."
    sleep 2
done

echo "Running migrations and seeders..."
php artisan migrate --force
php artisan db:seed --force

echo "Backend initialization complete. Executing command..."
exec "$@"

