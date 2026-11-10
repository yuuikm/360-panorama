<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreObjectRequest;
use App\Http\Requests\Admin\UpdateObjectRequest;
use App\Http\Resources\Admin\ObjectResource;
use App\Models\PanoramaObject;
use App\Services\QrCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class PanoramaObjectController extends Controller
{
    /**
     * Display a listing of objects.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = PanoramaObject::query()->withCount('panoramas');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = '%'.$request->input('search').'%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                    ->orWhere('description', 'like', $search);
            });
        }

        $objects = $query->latest('updated_at')->paginate($request->integer('per_page', 20));

        return ObjectResource::collection($objects);
    }

    /**
     * Store a newly created object.
     */
    public function store(StoreObjectRequest $request): JsonResponse
    {
        $object = PanoramaObject::create([
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'status' => $request->input('status', 'draft'),
        ]);

        return (new ObjectResource($object))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified object with panoramas and annotations.
     */
    public function show(PanoramaObject $object): ObjectResource
    {
        $object->load(['panoramas.annotations']);

        return new ObjectResource($object);
    }

    /**
     * Update the specified object.
     */
    public function update(UpdateObjectRequest $request, PanoramaObject $object): ObjectResource
    {
        $object->update($request->validated());

        return new ObjectResource($object);
    }

    /**
     * Remove the specified object and associated files.
     */
    public function destroy(PanoramaObject $object): JsonResponse
    {
        // Delete all panorama image files
        foreach ($object->panoramas as $panorama) {
            if ($panorama->image_path && Storage::disk('public')->exists($panorama->image_path)) {
                Storage::disk('public')->delete($panorama->image_path);
            }
        }

        $object->delete();

        return response()->json([
            'message' => 'Object deleted successfully',
        ]);
    }

    /**
     * Publish the object, generating a new public token if not present.
     */
    public function publish(PanoramaObject $object, QrCodeService $qrService): JsonResponse
    {
        // If no token exists, or upon publishing, generate a fresh secure token
        $rawToken = $object->generatePublicToken();
        $object->status = 'published';
        $object->published_at = now();
        $object->save();

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $publicUrl = $frontendUrl.'/view/'.$rawToken;
        $qrCodeSvg = $qrService->generateSvg($publicUrl);
        $qrCodeDataUri = $qrService->generateDataUri($publicUrl);

        return response()->json([
            'message' => 'Object published successfully',
            'object' => new ObjectResource($object),
            'public_token' => $rawToken,
            'public_url' => $publicUrl,
            'qr_code_svg' => $qrCodeSvg,
            'qr_code_data_uri' => $qrCodeDataUri,
        ]);
    }

    /**
     * Unpublish the object (revert to draft).
     */
    public function unpublish(PanoramaObject $object): JsonResponse
    {
        $object->status = 'draft';
        $object->save();

        return response()->json([
            'message' => 'Object unpublished successfully',
            'object' => new ObjectResource($object),
        ]);
    }

    /**
     * Regenerate public access token, immediately invalidating the previous one.
     */
    public function regenerateToken(PanoramaObject $object, QrCodeService $qrService): JsonResponse
    {
        $rawToken = $object->generatePublicToken();
        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $publicUrl = $frontendUrl.'/view/'.$rawToken;
        $qrCodeSvg = $qrService->generateSvg($publicUrl);
        $qrCodeDataUri = $qrService->generateDataUri($publicUrl);

        return response()->json([
            'message' => 'Token regenerated successfully',
            'object' => new ObjectResource($object),
            'public_token' => $rawToken,
            'public_url' => $publicUrl,
            'qr_code_svg' => $qrCodeSvg,
            'qr_code_data_uri' => $qrCodeDataUri,
        ]);
    }

    /**
     * Download or view QR code for a given token.
     */
    public function qr(Request $request, PanoramaObject $object, QrCodeService $qrService)
    {
        $token = $request->query('token');

        if (! $token) {
            return response()->json([
                'message' => 'The token query parameter is required to generate a QR code because plaintext tokens are not stored in the database.',
            ], 422);
        }

        // Verify the provided token matches the object hash
        if (hash('sha256', $token) !== $object->public_token_hash) {
            return response()->json([
                'message' => 'Invalid token provided for this object',
            ], 403);
        }

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $publicUrl = $frontendUrl.'/view/'.$token;
        $svg = $qrService->generateSvg($publicUrl);

        return response($svg, 200, [
            'Content-Type' => 'image/svg+xml',
            'Content-Disposition' => 'inline; filename="object-'.$object->id.'-qr.svg"',
        ]);
    }
}
