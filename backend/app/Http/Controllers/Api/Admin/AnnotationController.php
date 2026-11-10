<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAnnotationsRequest;
use App\Http\Requests\Admin\StoreAnnotationRequest;
use App\Http\Requests\Admin\UpdateAnnotationRequest;
use App\Http\Resources\Admin\AnnotationResource;
use App\Models\Annotation;
use App\Models\Panorama;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AnnotationController extends Controller
{
    /**
     * List all annotations belonging to a panorama.
     */
    public function index(Panorama $panorama): AnonymousResourceCollection
    {
        $annotations = $panorama->annotations()
            ->orderBy('sort_order')
            ->get();

        return AnnotationResource::collection($annotations);
    }

    /**
     * Store a newly created annotation on a panorama.
     */
    public function store(StoreAnnotationRequest $request, Panorama $panorama): JsonResponse
    {
        $sortOrder = $request->input('sort_order');
        if ($sortOrder === null) {
            $maxSort = $panorama->annotations()->max('sort_order');
            $sortOrder = $maxSort !== null ? $maxSort + 1 : 0;
        }

        $annotation = $panorama->annotations()->create([
            'type' => $request->input('type'),
            'template_key' => $request->input('template_key'),
            'position' => $request->input('position'),
            'content' => $request->input('content'),
            'style' => $request->input('style'),
            'sort_order' => (int) $sortOrder,
        ]);

        return (new AnnotationResource($annotation))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified annotation.
     */
    public function show(Annotation $annotation): AnnotationResource
    {
        return new AnnotationResource($annotation);
    }

    /**
     * Update the specified annotation.
     */
    public function update(UpdateAnnotationRequest $request, Annotation $annotation): AnnotationResource
    {
        $annotation->update($request->validated());

        return new AnnotationResource($annotation);
    }

    /**
     * Remove the specified annotation.
     */
    public function destroy(Annotation $annotation): JsonResponse
    {
        $annotation->delete();

        return response()->json([
            'message' => 'Annotation deleted successfully',
        ]);
    }

    /**
     * Reorder annotations for a panorama.
     */
    public function reorder(ReorderAnnotationsRequest $request, Panorama $panorama): JsonResponse
    {
        $orders = $request->input('orders', []);

        DB::transaction(function () use ($orders, $panorama) {
            foreach ($orders as $item) {
                $panorama->annotations()
                    ->where('id', $item['id'])
                    ->update(['sort_order' => $item['sort_order']]);
            }
        });

        return response()->json([
            'message' => 'Annotations reordered successfully',
        ]);
    }
}

