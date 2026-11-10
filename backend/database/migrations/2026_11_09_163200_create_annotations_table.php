<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('annotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('panorama_id')->constrained('panoramas')->cascadeOnDelete();
            $table->string('type', 64);
            $table->string('template_key', 64);
            $table->json('position');
            $table->json('content');
            $table->json('style')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['panorama_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('annotations');
    }
};

