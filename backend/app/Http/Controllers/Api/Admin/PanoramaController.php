<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderPanoramasRequest;
use App\Http\Requests\Admin\StorePanoramaRequest;
use App\Http\Requests\Admin\UpdatePanoramaRequest;
use App\Http\Resources\Admin\PanoramaResource;
use App\Models\Panorama;
use App\Models\PanoramaObject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PanoramaController extends Controller
{
    /**
     * List all panoramas belonging to the specified object.
     */
    public function index(PanoramaObject $object): AnonymousResourceCollection
    {
        $panoramas = $object->panoramas()
            ->withCount('annotations')
            ->orderBy('sort_order')
            ->get();

        return PanoramaResource::collection($panoramas);
    }

    /**
     * Store a newly created panorama with uploaded image.
     */
    public function store(StorePanoramaRequest $request, PanoramaObject $object): JsonResponse
    {
        $file = $request->file('image');
        $filePath = $file->store("panoramas/{$object->id}", 'public');

        $dimensions = @getimagesize($file->getRealPath());
        $width = $dimensions ? $dimensions[0] : null;
        $height = $dimensions ? $dimensions[1] : null;

        $sortOrder = $request->input('sort_order');
        if ($sortOrder === null) {
            $maxSort = $object->panoramas()->max('sort_order');
            $sortOrder = $maxSort !== null ? $maxSort + 1 : 0;
        }

        $panorama = $object->panoramas()->create([
            'title' => $request->input('title'),
            'image_path' => $filePath,
            'image_mime_type' => $file->getClientMimeType() ?: $file->getMimeType(),
            'image_size' => $file->getSize(),
            'width' => $width,
            'height' => $height,
            'sort_order' => (int) $sortOrder,
            'status' => $request->input('status', 'ready'),
            'viewer_type' => $request->input('viewer_type', 'flat'),
        ]);

        return (new PanoramaResource($panorama))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified panorama with annotations.
     */
    public function show(Panorama $panorama): PanoramaResource
    {
        $panorama->load('annotations');

        return new PanoramaResource($panorama);
    }

    /**
     * Update the specified panorama.
     */
    public function update(UpdatePanoramaRequest $request, Panorama $panorama): PanoramaResource
    {
        $data = $request->only(['title', 'sort_order', 'status', 'viewer_type']);

        if ($request->hasFile('image')) {
            // Delete previous image file
            if ($panorama->image_path && Storage::disk('public')->exists($panorama->image_path)) {
                Storage::disk('public')->delete($panorama->image_path);
            }

            $file = $request->file('image');
            $filePath = $file->store("panoramas/{$panorama->object_id}", 'public');
            $dimensions = @getimagesize($file->getRealPath());

            $data['image_path'] = $filePath;
            $data['image_mime_type'] = $file->getClientMimeType() ?: $file->getMimeType();
            $data['image_size'] = $file->getSize();
            $data['width'] = $dimensions ? $dimensions[0] : null;
            $data['height'] = $dimensions ? $dimensions[1] : null;
        }

        $panorama->update($data);

        return new PanoramaResource($panorama);
    }

    /**
     * Remove the specified panorama and its image file.
     */
    public function destroy(Panorama $panorama): JsonResponse
    {
        if ($panorama->image_path && Storage::disk('public')->exists($panorama->image_path)) {
            Storage::disk('public')->delete($panorama->image_path);
        }

        $panorama->delete();

        return response()->json([
            'message' => 'Panorama deleted successfully',
        ]);
    }

    /**
     * Reorder panoramas for an object.
     */
    public function reorder(ReorderPanoramasRequest $request, PanoramaObject $object): JsonResponse
    {
        $orders = $request->input('orders', []);

        DB::transaction(function () use ($orders, $object) {
            foreach ($orders as $item) {
                $object->panoramas()
                    ->where('id', $item['id'])
                    ->update(['sort_order' => $item['sort_order']]);
            }
        });

        return response()->json([
            'message' => 'Panoramas reordered successfully',
        ]);
    }
}

