<?php

use App\Models\PanoramaObject;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create();
});

test('unauthenticated users cannot access object management', function () {
    $this->getJson('/api/admin/objects')->assertStatus(401);
    $this->postJson('/api/admin/objects', ['title' => 'Test'])->assertStatus(401);
});

test('admin can list objects with pagination', function () {
    PanoramaObject::create(['title' => 'Office 1', 'status' => 'draft']);
    PanoramaObject::create(['title' => 'Office 2', 'status' => 'published']);

    $response = $this->actingAs($this->admin)->getJson('/api/admin/objects');

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data')
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'title', 'status', 'panoramas_count', 'has_token'],
            ],
            'links',
            'meta',
        ]);
});

test('admin can create a new object', function () {
    $response = $this->actingAs($this->admin)->postJson('/api/admin/objects', [
        'title' => 'Villa Panorama',
        'description' => 'A luxury villa with 360 views',
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'title' => 'Villa Panorama',
                'description' => 'A luxury villa with 360 views',
                'status' => 'draft',
            ],
        ]);

    $this->assertDatabaseHas('objects', [
        'title' => 'Villa Panorama',
        'status' => 'draft',
    ]);
});

test('admin can view a single object', function () {
    $object = PanoramaObject::create([
        'title' => 'Modern Apartment',
        'description' => 'Spacious 3-room flat',
    ]);

    $response = $this->actingAs($this->admin)->getJson("/api/admin/objects/{$object->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $object->id,
                'title' => 'Modern Apartment',
                'description' => 'Spacious 3-room flat',
            ],
        ]);
});

test('admin can update an object', function () {
    $object = PanoramaObject::create(['title' => 'Old Title']);

    $response = $this->actingAs($this->admin)->patchJson("/api/admin/objects/{$object->id}", [
        'title' => 'Updated Title',
        'description' => 'New Description',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'title' => 'Updated Title',
                'description' => 'New Description',
            ],
        ]);

    $this->assertDatabaseHas('objects', [
        'id' => $object->id,
        'title' => 'Updated Title',
    ]);
});

test('admin can delete an object', function () {
    $object = PanoramaObject::create(['title' => 'To Delete']);

    $response = $this->actingAs($this->admin)->deleteJson("/api/admin/objects/{$object->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('objects', ['id' => $object->id]);
});

test('admin can publish an object and receive token, url, and qr code', function () {
    $object = PanoramaObject::create(['title' => 'Showroom', 'status' => 'draft']);

    $response = $this->actingAs($this->admin)->postJson("/api/admin/objects/{$object->id}/publish");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'message',
            'object',
            'public_token',
            'public_url',
            'qr_code_svg',
            'qr_code_data_uri',
        ]);

    $token = $response->json('public_token');
    expect($token)->toBeString()->toHaveLength(64);

    $object->refresh();
    expect($object->status)->toBe('published');
    expect($object->public_token_hash)->toBe(hash('sha256', $token));
    expect($object->published_at)->not->toBeNull();
});

test('admin can regenerate token and invalidate previous token', function () {
    $object = PanoramaObject::create(['title' => 'Showroom', 'status' => 'draft']);
    $firstToken = $object->generatePublicToken();
    $firstHash = $object->public_token_hash;

    $response = $this->actingAs($this->admin)->postJson("/api/admin/objects/{$object->id}/regenerate-token");

    $response->assertStatus(200);
    $secondToken = $response->json('public_token');

    $object->refresh();
    expect($secondToken)->not->toBe($firstToken);
    expect($object->public_token_hash)->not->toBe($firstHash);
    expect($object->public_token_hash)->toBe(hash('sha256', $secondToken));
});

test('admin can unpublish an object', function () {
    $object = PanoramaObject::create(['title' => 'Published Showroom', 'status' => 'published']);

    $response = $this->actingAs($this->admin)->postJson("/api/admin/objects/{$object->id}/unpublish");

    $response->assertStatus(200);
    $object->refresh();
    expect($object->status)->toBe('draft');
});

test('admin can request qr code with valid token query parameter', function () {
    $object = PanoramaObject::create(['title' => 'Showroom']);
    $token = $object->generatePublicToken();

    $response = $this->actingAs($this->admin)->get("/api/admin/objects/{$object->id}/qr?token={$token}");

    $response->assertStatus(200)
        ->assertHeader('Content-Type', 'image/svg+xml');
});

