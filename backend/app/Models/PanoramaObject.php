<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PanoramaObject extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'objects';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'description',
        'status',
        'public_token_hash',
        'published_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }

    /**
     * Get the panoramas associated with this object.
     */
    public function panoramas(): HasMany
    {
        return $this->hasMany(Panorama::class, 'object_id')->orderBy('sort_order');
    }

    /**
     * Generate a new cryptographically secure public access token and store its hash.
     * Returns the unhashed token (URL safe).
     */
    public function generatePublicToken(): string
    {
        $rawToken = bin2hex(random_bytes(32)); // 64 hex characters (32 cryptographically secure bytes)
        $this->public_token_hash = hash('sha256', $rawToken);
        $this->save();

        return $rawToken;
    }

    /**
     * Determine if the object is published.
     */
    public function isPublished(): bool
    {
        return $this->status === 'published';
    }
}
