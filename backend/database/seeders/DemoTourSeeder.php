<?php

namespace Database\Seeders;

use App\Models\PanoramaObject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class DemoTourSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure storage directory exists
        Storage::disk('public')->makeDirectory('panoramas/demo');

        // Generate 2 sample equirectangular images if they do not exist
        $room1Path = 'panoramas/demo/living_room.jpg';
        $room2Path = 'panoramas/demo/balcony.jpg';

        $this->generateEquirectangularImage($room1Path, 'Гостиная зона (360° Panorama)', [35, 45, 65], [18, 22, 34]);
        $this->generateEquirectangularImage($room2Path, 'Терраса и балкон (360° Panorama)', [25, 40, 50], [12, 18, 28]);

        // Create or find Demo Object
        $object = PanoramaObject::firstOrCreate(
            ['title' => 'Демо-объект: Современный лофт 360°'],
            [
                'description' => 'Демонстрационный объект с двумя панорамными помещениями, размерами и интерактивными выносками.',
                'status' => 'published',
                'published_at' => now(),
            ]
        );

        // Generate a public token if none
        if (! $object->public_token_hash) {
            $object->generatePublicToken();
        }

        // Room 1: Living room
        $p1 = $object->panoramas()->updateOrCreate(
            ['title' => 'Гостиная зона'],
            [
                'image_path' => $room1Path,
                'image_mime_type' => 'image/jpeg',
                'image_size' => Storage::disk('public')->size($room1Path) ?: 150000,
                'width' => 2048,
                'height' => 1024,
                'sort_order' => 0,
                'status' => 'ready',
            ]
        );

        // Add annotations to room 1
        $p1->annotations()->delete();
        $p1->annotations()->createMany([
            [
                'type' => 'label',
                'template_key' => 'simple-label',
                'position' => ['yaw' => 0.0, 'pitch' => 5.0],
                'content' => ['title' => 'Зона отдыха'],
                'style' => ['backgroundColor' => '#4f46e5', 'color' => '#ffffff'],
                'sort_order' => 0,
            ],
            [
                'type' => 'measurement',
                'template_key' => 'measurement',
                'position' => ['yaw' => 45.0, 'pitch' => 12.0],
                'content' => ['title' => 'Высота потолков', 'value' => '3.2', 'unit' => 'м'],
                'style' => ['backgroundColor' => '#059669', 'color' => '#ffffff'],
                'sort_order' => 1,
            ],
            [
                'type' => 'callout',
                'template_key' => 'callout',
                'position' => ['yaw' => -50.0, 'pitch' => -8.0],
                'content' => [
                    'title' => 'Панорамное остекление',
                    'text' => 'Энергосберегающие двухкамерные стеклопакеты с защитой от ультрафиолета.',
                ],
                'style' => ['backgroundColor' => '#0284c7', 'color' => '#ffffff'],
                'sort_order' => 2,
            ],
            [
                'type' => 'marker',
                'template_key' => 'marker',
                'position' => ['yaw' => 120.0, 'pitch' => -2.0],
                'content' => [
                    'title' => 'Выход на террасу',
                    'text' => 'Сдвижные стеклянные двери Schüco.',
                ],
                'style' => ['backgroundColor' => '#d97706', 'color' => '#ffffff'],
                'sort_order' => 3,
            ],
        ]);

        // Room 2: Balcony
        $p2 = $object->panoramas()->updateOrCreate(
            ['title' => 'Терраса и балкон'],
            [
                'image_path' => $room2Path,
                'image_mime_type' => 'image/jpeg',
                'image_size' => Storage::disk('public')->size($room2Path) ?: 150000,
                'width' => 2048,
                'height' => 1024,
                'sort_order' => 1,
                'status' => 'ready',
            ]
        );

        $p2->annotations()->delete();
        $p2->annotations()->createMany([
            [
                'type' => 'measurement',
                'template_key' => 'measurement',
                'position' => ['yaw' => 10.0, 'pitch' => -15.0],
                'content' => ['title' => 'Площадь террасы', 'value' => '18.5', 'unit' => 'м²'],
                'style' => ['backgroundColor' => '#059669', 'color' => '#ffffff'],
                'sort_order' => 0,
            ],
            [
                'type' => 'callout',
                'template_key' => 'callout',
                'position' => ['yaw' => 90.0, 'pitch' => 0.0],
                'content' => [
                    'title' => 'Вид на парк',
                    'text' => 'Прямой панорамный вид на зеленую зону и набережную.',
                ],
                'style' => ['backgroundColor' => '#4f46e5', 'color' => '#ffffff'],
                'sort_order' => 1,
            ],
        ]);
    }

    /**
     * Generate equirectangular gradient panorama image with walls, grid and labels.
     */
    private function generateEquirectangularImage(string $relativePath, string $caption, array $topColor, array $bottomColor): void
    {
        $fullPath = Storage::disk('public')->path($relativePath);
        if (file_exists($fullPath)) {
            return;
        }

        $width = 2048;
        $height = 1024;
        $img = imagecreatetruecolor($width, $height);

        // Vertical gradient (ceiling to floor)
        for ($y = 0; $y < $height; $y++) {
            $ratio = $y / (float) $height;
            $r = (int) ($topColor[0] * (1 - $ratio) + $bottomColor[0] * $ratio);
            $g = (int) ($topColor[1] * (1 - $ratio) + $bottomColor[1] * $ratio);
            $b = (int) ($topColor[2] * (1 - $ratio) + $bottomColor[2] * $ratio);

            $lineColor = imagecolorallocate($img, $r, $g, $b);
            imageline($img, 0, $y, $width, $y, $lineColor);
        }

        // Draw spherical grid lines (parallels and meridians)
        $gridColor = imagecolorallocatealpha($img, 255, 255, 255, 105);
        $horizonColor = imagecolorallocatealpha($img, 99, 102, 241, 70);

        // Horizon line (equator: pitch 0)
        imagesetthickness($img, 3);
        imageline($img, 0, (int) ($height / 2), $width, (int) ($height / 2), $horizonColor);

        // Parallels every 30 degrees
        imagesetthickness($img, 1);
        for ($lat = -60; $lat <= 60; $lat += 30) {
            if ($lat === 0) continue;
            $y = (int) (($lat + 90) / 180.0 * $height);
            imageline($img, 0, $y, $width, $y, $gridColor);
        }

        // Meridians every 45 degrees
        for ($lon = 0; $lon < 360; $lon += 45) {
            $x = (int) ($lon / 360.0 * $width);
            imageline($img, $x, 0, $x, $height, $gridColor);
        }

        // Compass orientation labels (N, E, S, W)
        $textColor = imagecolorallocate($img, 255, 255, 255);
        $font = 5; // Built-in GD font
        $directions = [
            0 => 'NORTH (0°)',
            90 => 'EAST (90°)',
            180 => 'SOUTH (180°)',
            270 => 'WEST (270°)',
        ];

        foreach ($directions as $deg => $label) {
            $x = (int) ($deg / 360.0 * $width) + 20;
            $y = (int) ($height / 2) - 20;
            imagestring($img, $font, $x, $y, $label, $textColor);
        }

        // Caption at center
        imagestring($img, $font, (int) ($width / 2) - 150, (int) ($height / 2) + 20, $caption, $textColor);

        @mkdir(dirname($fullPath), 0775, true);
        imagejpeg($img, $fullPath, 90);
        imagedestroy($img);
    }
}

