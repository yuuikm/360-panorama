<?php

use App\Models\Panorama;
use App\Models\PanoramaObject;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->object = PanoramaObject::create(['title' => 'Sample Building']);
    Storage::fake('public');
});

test('admin can upload a panorama image to an object', function () {
    $image = UploadedFile::fake()->image('hallway.jpg', 4000, 2000)->size(3000);

    $response = $this->actingAs($this->admin)->postJson("/api/admin/objects/{$this->object->id}/panoramas", [
        'title' => 'Main Hallway',
        'image' => $image,
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'title' => 'Main Hallway',
                'object_id' => $this->object->id,
                'width' => 4000,
                'height' => 2000,
                'status' => 'ready',
            ],
        ]);

    $panorama = Panorama::first();
    expect($panorama)->not->toBeNull();
    Storage::disk('public')->assertExists($panorama->image_path);
});

test('admin can list panoramas for an object', function () {
    $this->object->panoramas()->create([
        'title' => 'Kitchen',
        'image_path' => 'panoramas/test1.jpg',
        'image_mime_type' => 'image/jpeg',
        'image_size' => 1024,
        'sort_order' => 1,
    ]);

    $this->object->panoramas()->create([
        'title' => 'Living Room',
        'image_path' => 'panoramas/test2.jpg',
        'image_mime_type' => 'image/jpeg',
        'image_size' => 1024,
        'sort_order' => 0,
    ]);

    $response = $this->actingAs($this->admin)->getJson("/api/admin/objects/{$this->object->id}/panoramas");

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data');

    // Should be ordered by sort_order
    expect($response->json('data.0.title'))->toBe('Living Room');
    expect($response->json('data.1.title'))->toBe('Kitchen');
});

test('admin can view a single panorama', function () {
    $panorama = $this->object->panoramas()->create([
        'title' => 'Balcony',
        'image_path' => 'panoramas/balcony.jpg',
        'image_mime_type' => 'image/jpeg',
        'image_size' => 1024,
    ]);

    $response = $this->actingAs($this->admin)->getJson("/api/admin/panoramas/{$panorama->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $panorama->id,
                'title' => 'Balcony',
            ],
        ]);
});

test('admin can update a panorama title', function () {
    $panorama = $this->object->panoramas()->create([
        'title' => 'Old Room Name',
        'image_path' => 'panoramas/room.jpg',
        'image_mime_type' => 'image/jpeg',
        'image_size' => 1024,
    ]);

    $response = $this->actingAs($this->admin)->patchJson("/api/admin/panoramas/{$panorama->id}", [
        'title' => 'Master Bedroom',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'title' => 'Master Bedroom',
            ],
        ]);

    $this->assertDatabaseHas('panoramas', [
        'id' => $panorama->id,
        'title' => 'Master Bedroom',
    ]);
});

test('admin can delete a panorama and remove its file', function () {
    $image = UploadedFile::fake()->image('to_delete.jpg', 1000, 500);
    $path = $image->store('panoramas/1', 'public');

    $panorama = $this->object->panoramas()->create([
        'title' => 'To Delete',
        'image_path' => $path,
        'image_mime_type' => 'image/jpeg',
        'image_size' => 1024,
    ]);

    Storage::disk('public')->assertExists($path);

    $response = $this->actingAs($this->admin)->deleteJson("/api/admin/panoramas/{$panorama->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('panoramas', ['id' => $panorama->id]);
    Storage::disk('public')->assertMissing($path);
});

test('admin can reorder panoramas', function () {
    $p1 = $this->object->panoramas()->create([
        'title' => 'P1',
        'image_path' => 'panoramas/p1.jpg',
        'image_mime_type' => 'image/jpeg',
        'image_size' => 1024,
        'sort_order' => 0,
    ]);

    $p2 = $this->object->panoramas()->create([
        'title' => 'P2',
        'image_path' => 'panoramas/p2.jpg',
        'image_mime_type' => 'image/jpeg',
        'image_size' => 1024,
        'sort_order' => 1,
    ]);

    $response = $this->actingAs($this->admin)->postJson("/api/admin/objects/{$this->object->id}/panoramas/reorder", [
        'orders' => [
            ['id' => $p1->id, 'sort_order' => 5],
            ['id' => $p2->id, 'sort_order' => 1],
        ],
    ]);

    $response->assertStatus(200);

    expect($p1->fresh()->sort_order)->toBe(5);
    expect($p2->fresh()->sort_order)->toBe(1);
});

