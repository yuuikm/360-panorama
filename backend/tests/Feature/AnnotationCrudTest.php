<?php

use App\Models\PanoramaObject;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->object = PanoramaObject::create(['title' => 'Sample Building']);
    $this->panorama = $this->object->panoramas()->create([
        'title' => 'Living Room',
        'image_path' => 'panoramas/test.jpg',
        'image_mime_type' => 'image/jpeg',
        'image_size' => 1024,
    ]);
});

test('admin can create an annotation on a panorama', function () {
    $response = $this->actingAs($this->admin)->postJson("/api/admin/panoramas/{$this->panorama->id}/annotations", [
        'type' => 'label',
        'template_key' => 'simple-label',
        'position' => ['yaw' => 45.5, 'pitch' => -10.2],
        'content' => ['title' => 'Ceiling Height', 'value' => '3 m'],
        'style' => ['color' => '#ffffff', 'backgroundColor' => '#000000'],
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'type' => 'label',
                'template_key' => 'simple-label',
                'position' => ['yaw' => 45.5, 'pitch' => -10.2],
                'content' => ['title' => 'Ceiling Height', 'value' => '3 m'],
            ],
        ]);

    $this->assertDatabaseHas('annotations', [
        'panorama_id' => $this->panorama->id,
        'type' => 'label',
        'template_key' => 'simple-label',
    ]);
});

test('annotation creation validates pitch and yaw coordinate ranges', function () {
    // Pitch out of bounds (> 90)
    $response = $this->actingAs($this->admin)->postJson("/api/admin/panoramas/{$this->panorama->id}/annotations", [
        'type' => 'label',
        'template_key' => 'simple-label',
        'position' => ['yaw' => 0, 'pitch' => 95],
        'content' => ['title' => 'Test'],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['position.pitch']);
});

test('admin can list annotations of a panorama', function () {
    $this->panorama->annotations()->create([
        'type' => 'marker',
        'template_key' => 'marker',
        'position' => ['yaw' => 10, 'pitch' => 20],
        'content' => ['text' => 'Door'],
        'sort_order' => 1,
    ]);

    $this->panorama->annotations()->create([
        'type' => 'callout',
        'template_key' => 'callout',
        'position' => ['yaw' => 30, 'pitch' => -15],
        'content' => ['text' => 'Window'],
        'sort_order' => 0,
    ]);

    $response = $this->actingAs($this->admin)->getJson("/api/admin/panoramas/{$this->panorama->id}/annotations");

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data');

    // Ordered by sort_order
    expect($response->json('data.0.type'))->toBe('callout');
    expect($response->json('data.1.type'))->toBe('marker');
});

test('admin can update an annotation', function () {
    $annotation = $this->panorama->annotations()->create([
        'type' => 'label',
        'template_key' => 'simple-label',
        'position' => ['yaw' => 0, 'pitch' => 0],
        'content' => ['text' => 'Old'],
    ]);

    $response = $this->actingAs($this->admin)->patchJson("/api/admin/annotations/{$annotation->id}", [
        'position' => ['yaw' => 90, 'pitch' => 45],
        'content' => ['text' => 'Updated text'],
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'position' => ['yaw' => 90, 'pitch' => 45],
                'content' => ['text' => 'Updated text'],
            ],
        ]);
});

test('admin can delete an annotation', function () {
    $annotation = $this->panorama->annotations()->create([
        'type' => 'label',
        'template_key' => 'simple-label',
        'position' => ['yaw' => 0, 'pitch' => 0],
        'content' => ['text' => 'To delete'],
    ]);

    $response = $this->actingAs($this->admin)->deleteJson("/api/admin/annotations/{$annotation->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('annotations', ['id' => $annotation->id]);
});

test('admin can reorder annotations', function () {
    $a1 = $this->panorama->annotations()->create([
        'type' => 'label',
        'template_key' => 'simple-label',
        'position' => ['yaw' => 0, 'pitch' => 0],
        'content' => ['text' => 'A1'],
        'sort_order' => 0,
    ]);

    $a2 = $this->panorama->annotations()->create([
        'type' => 'label',
        'template_key' => 'simple-label',
        'position' => ['yaw' => 0, 'pitch' => 0],
        'content' => ['text' => 'A2'],
        'sort_order' => 1,
    ]);

    $response = $this->actingAs($this->admin)->postJson("/api/admin/panoramas/{$this->panorama->id}/annotations/reorder", [
        'orders' => [
            ['id' => $a1->id, 'sort_order' => 10],
            ['id' => $a2->id, 'sort_order' => 2],
        ],
    ]);

    $response->assertStatus(200);
    expect($a1->fresh()->sort_order)->toBe(10);
    expect($a2->fresh()->sort_order)->toBe(2);
});
