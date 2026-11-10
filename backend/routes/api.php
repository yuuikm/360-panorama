<?php

use App\Http\Controllers\Api\Admin\AnnotationController;
use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\Admin\PanoramaController;
use App\Http\Controllers\Api\Admin\PanoramaObjectController;
use App\Http\Controllers\Api\Public\PublicObjectController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::prefix('public')->group(function () {
    Route::get('/objects/{publicToken}', [PublicObjectController::class, 'show'])
        ->middleware('throttle:60,1');
});

/*
|--------------------------------------------------------------------------
| Admin Authentication Routes
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        // Object management
        Route::get('/objects', [PanoramaObjectController::class, 'index']);
        Route::post('/objects', [PanoramaObjectController::class, 'store']);
        Route::get('/objects/{object}', [PanoramaObjectController::class, 'show']);
        Route::patch('/objects/{object}', [PanoramaObjectController::class, 'update']);
        Route::delete('/objects/{object}', [PanoramaObjectController::class, 'destroy']);
        Route::post('/objects/{object}/publish', [PanoramaObjectController::class, 'publish']);
        Route::post('/objects/{object}/unpublish', [PanoramaObjectController::class, 'unpublish']);
        Route::post('/objects/{object}/regenerate-token', [PanoramaObjectController::class, 'regenerateToken']);
        Route::get('/objects/{object}/qr', [PanoramaObjectController::class, 'qr']);

        // Panoramas within object
        Route::get('/objects/{object}/panoramas', [PanoramaController::class, 'index']);
        Route::post('/objects/{object}/panoramas', [PanoramaController::class, 'store']);
        Route::post('/objects/{object}/panoramas/reorder', [PanoramaController::class, 'reorder']);

        // Panorama individual operations
        Route::get('/panoramas/{panorama}', [PanoramaController::class, 'show']);
        Route::patch('/panoramas/{panorama}', [PanoramaController::class, 'update']);
        Route::post('/panoramas/{panorama}', [PanoramaController::class, 'update']); // for multipart updates
        Route::delete('/panoramas/{panorama}', [PanoramaController::class, 'destroy']);

        // Annotations within panorama
        Route::get('/panoramas/{panorama}/annotations', [AnnotationController::class, 'index']);
        Route::post('/panoramas/{panorama}/annotations', [AnnotationController::class, 'store']);
        Route::post('/panoramas/{panorama}/annotations/reorder', [AnnotationController::class, 'reorder']);

        // Annotation individual operations
        Route::get('/annotations/{annotation}', [AnnotationController::class, 'show']);
        Route::patch('/annotations/{annotation}', [AnnotationController::class, 'update']);
        Route::delete('/annotations/{annotation}', [AnnotationController::class, 'destroy']);
    });
});
