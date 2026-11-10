<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('public storage route serves uploaded files with CORS headers', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('test_panorama.jpg', 100, 50);
    $path = $file->store('panoramas/1', 'public');

    $response = $this->get("/storage/{$path}");

    $response->assertStatus(200);
    $response->assertHeader('Access-Control-Allow-Origin', '*');
});

test('public storage route returns 404 for non-existent files', function () {
    Storage::fake('public');

    $response = $this->get('/storage/panoramas/non_existent.jpg');

    $response->assertStatus(404);
});

