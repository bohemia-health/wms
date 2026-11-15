"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { addImage, deleteImage } from "./actions";
import type { Item } from "./item/types";

// The item's images under its batches. Choosing a file uploads it straight
// away; there is no separate save step, the same as a batch.
export function ItemImages({ item }: { item: Item }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear the input so picking the same file twice still fires a change.
    event.target.value = "";
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("alt", `${item.name}${item.size ? ` ${item.size} mg` : ""}`);
    startTransition(async () => {
      const result = await addImage(item.id, formData);
      if (!result.ok) setError(result.error);
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteImage(id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <section className="grid gap-3 border-t pt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Images
          <span className="pl-2 font-normal text-muted-foreground">
            {item.images.length === 0
              ? "none yet"
              : "the first one is shown on the store"}
          </span>
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => picker.current?.click()}
        >
          <ImagePlusIcon data-icon="inline-start" />
          {pending ? "Working…" : "Add image"}
        </Button>
        <input
          ref={picker}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={upload}
        />
      </div>

      {item.images.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {item.images.map((image, index) => (
            <li
              key={image.id}
              className="group relative size-24 overflow-hidden rounded-md border bg-background"
            >
              <Image
                src={image.url}
                alt={image.alt ?? ""}
                fill
                sizes="96px"
                className="object-contain"
              />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-medium text-background">
                  Store
                </span>
              )}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Remove image"
                disabled={pending}
                onClick={() => remove(image.id)}
                className="absolute right-1 top-1 size-6 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
