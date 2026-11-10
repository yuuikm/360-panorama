<?php

use App\Models\User;

test('admin can log in with valid credentials and receive token', function () {
    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('secret123'),
    ]);

    $response = $this->postJson('/api/admin/login', [
        'email' => 'admin@example.com',
        'password' => 'secret123',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'token',
            'user' => ['id', 'name', 'email'],
        ]);
});

test('admin login fails with invalid credentials', function () {
    User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('secret123'),
    ]);

    $response = $this->postJson('/api/admin/login', [
        'email' => 'admin@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('admin can retrieve current profile', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/admin/me');

    $response->assertStatus(200)
        ->assertJson([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
            ],
        ]);
});

test('admin can log out and revoke token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/admin/logout');

    $response->assertStatus(200);
    expect($user->tokens()->count())->toBe(0);
});
