"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, ProgressPhoto, PHOTOS_BUCKET } from "@/lib/supabase";
import { todayISO, formatDateFull } from "@/lib/date-utils";

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas indisponible"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Échec de compression"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image invalide"));
    };
    img.src = url;
  });
}

export default function PhotosSection({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<ProgressPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false });
    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }
    const list = (data as ProgressPhoto[]) ?? [];
    setPhotos(list);
    const urlMap: Record<string, string> = {};
    list.forEach((p) => {
      urlMap[p.id] = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(p.storage_path)
        .data.publicUrl;
    });
    setUrls(urlMap);
    setLoading(false);
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de reprendre la même photo une seconde fois
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const resized = await resizeImage(file);
      const path = `${userId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(path, resized, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("progress_photos").insert({
        user_id: userId,
        entry_date: todayISO(),
        storage_path: path,
      });
      if (insertError) throw insertError;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo: ProgressPhoto) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([photo.storage_path]);
    await supabase.from("progress_photos").delete().eq("id", photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    if (lightbox?.id === photo.id) setLightbox(null);
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full bg-accent hover:bg-accentSoft text-white font-semibold text-sm rounded-lg py-3 disabled:opacity-60"
      >
        {uploading ? "Envoi…" : "+ Ajouter une photo"}
      </button>
      {error && <p className="text-[#c0524a] text-xs">{error}</p>}

      {loading ? (
        <p className="text-dim text-sm py-2">Chargement…</p>
      ) : photos.length === 0 ? (
        <p className="text-dim text-sm py-2">Aucune photo pour l&rsquo;instant.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setLightbox(p)}
              className="aspect-square rounded-lg overflow-hidden bg-panel2 border border-line"
            >
              {urls[p.id] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[p.id]}
                  alt={`Photo du ${formatDateFull(p.entry_date)}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center px-4"
          onClick={() => setLightbox(null)}
        >
          <div className="w-full max-w-md">
            {urls[lightbox.id] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urls[lightbox.id]}
                alt={`Photo du ${formatDateFull(lightbox.entry_date)}`}
                className="w-full rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-dim text-sm">
                {formatDateFull(lightbox.entry_date)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(lightbox);
                }}
                className="text-[#c0524a] text-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
