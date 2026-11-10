<?php

use App\Models\PanoramaObject;

test('cannot access public object by numeric id', function () {
    $object = PanoramaObject::create([
        'title' => 'Secret Villa',
        'status' => 'published',
    ]);

    $this->getJson("/api/public/objects/{$object->id}")
        ->assertStatus(404);
});

test('invalid public token returns 404 not found', function () {
    $this->getJson('/api/public/objects/non-existent-random-token-12345678901234567890')
        ->assertStatus(404);
});

test('draft object cannot be accessed even with token', function () {
    $object = PanoramaObject::create([
        'title' => 'Draft Villa',
        'status' => 'draft',
    ]);
    $token = $object->generatePublicToken();

    $this->getJson("/api/public/objects/{$token}")
        ->assertStatus(404);
});

test('published object with valid token returns public resource', function () {
    $object = PanoramaObject::create([
        'title' => 'Modern Loft',
        'description' => 'Bright open space with high ceiling',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $token = $object->generatePublicToken();

    $panorama = $object->panoramas()->create([
        'title' => 'Main Hall',
        'image_path' => 'panoramas/hall.jpg',
        'image_mime_type' => 'image/jpeg',
        'image_size' => 2048,
        'width' => 4096,
        'height' => 2048,
        'sort_order' => 0,
        'status' => 'ready',
    ]);

    $panorama->annotations()->create([
        'type' => 'label',
        'template_key' => 'simple-label',
        'position' => ['yaw' => 45.0, 'pitch' => -10.0],
        'content' => ['title' => 'Air Conditioner'],
        'style' => ['color' => '#ffffff'],
        'sort_order' => 0,
    ]);

    $response = $this->getJson("/api/public/objects/{$token}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'title' => 'Modern Loft',
                'description' => 'Bright open space with high ceiling',
                'panoramas' => [
                    [
                        'title' => 'Main Hall',
                        'width' => 4096,
                        'height' => 2048,
                        'annotations' => [
                            [
                                'type' => 'label',
                                'template_key' => 'simple-label',
                                'position' => ['yaw' => 45.0, 'pitch' => -10.0],
                                'content' => ['title' => 'Air Conditioner'],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

    // Ensure internal fields are never exposed
    $json = $response->json('data');
    expect(array_key_exists('public_token_hash', $json))->toBeFalse();
    expect(array_key_exists('user_id', $json))->toBeFalse();
});

test('regenerating token immediately invalidates previous token', function () {
    $object = PanoramaObject::create([
        'title' => 'Penthouse',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $firstToken = $object->generatePublicToken();

    // Verify first token works
    $this->getJson("/api/public/objects/{$firstToken}")->assertStatus(200);

    // Regenerate token
    $secondToken = $object->generatePublicToken();

    // First token must now immediately return 404
    $this->getJson("/api/public/objects/{$firstToken}")->assertStatus(404);

    // Second token works
    $this->getJson("/api/public/objects/{$secondToken}")->assertStatus(200);
});

