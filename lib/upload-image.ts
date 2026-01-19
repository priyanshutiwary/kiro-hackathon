// Using Cloudflare R2 bindings instead of AWS SDK to reduce bundle size
// The R2 bucket binding is configured in wrangler.toml

export const uploadImageAssets = async (buffer: Buffer, key: string) => {
  // Note: In production, you'll need to access the R2 binding from the request context
  // For now, we'll use fetch API to upload to R2 via presigned URL or direct API
  // This is a placeholder - you'll need to implement based on your R2 setup
  
  // Option 1: Use R2 binding (requires passing binding from route handler)
  // await env.R2_BUCKET.put(key, buffer, {
  //   httpMetadata: { contentType: "image/*" }
  // });
  
  // Option 2: Use R2 HTTP API (lighter than AWS SDK)
  const response = await fetch(
    `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_UPLOAD_IMAGE_BUCKET_NAME}/${key}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "image/*",
        "X-Auth-Key": process.env.R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY!,
        "X-Auth-Email": process.env.CLOUDFLARE_EMAIL || "",
      },
      body: buffer,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }

  const publicUrl = `https://pub-6f0cf05705c7412b93a792350f3b3aa5.r2.dev/${key}`;
  return publicUrl;
};
