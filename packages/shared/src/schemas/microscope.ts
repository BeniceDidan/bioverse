import { z } from "zod";

export const createHotspotSchema = z.object({
  xPercent: z.number().min(0).max(100),
  yPercent: z.number().min(0).max(100),
  label: z.string().trim().min(1, "Nama label wajib diisi").max(80),
  // Optional on purpose: the slide already carries the tissue name, so asking
  // for it again per label duplicated it and let the two drift apart. The
  // server fills it in from the slide when the client omits it.
  tissueName: z.string().trim().max(120).optional(),
  tissueFunction: z.string().trim().min(1, "Fungsi wajib diisi").max(500),
  characteristics: z.string().trim().min(1, "Ciri-ciri wajib diisi").max(500),
  location: z.string().trim().min(1, "Lokasi wajib diisi").max(200),
  example: z.string().trim().min(1, "Contoh wajib diisi").max(500),
});
export type CreateHotspotInput = z.infer<typeof createHotspotSchema>;

export const updateHotspotSchema = createHotspotSchema.partial();
export type UpdateHotspotInput = z.infer<typeof updateHotspotSchema>;

export const createSlideMetaSchema = z.object({
  materialSectionId: z.string().trim().min(1, "Pilih submateri"),
  tissueName: z.string().trim().min(1, "Nama jaringan wajib diisi").max(120),
  description: z.string().trim().min(1, "Deskripsi wajib diisi").max(500),
});
export type CreateSlideMetaInput = z.infer<typeof createSlideMetaSchema>;
