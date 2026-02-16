const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,OPTIONS,DELETE",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

export const onRequestGet: PagesFunction = async (context) => {
  // Get device type from query parameter, default to 'hackrf'
  const url = new URL(context.request.url);
  const deviceType = url.searchParams.get("device") || "hackrf";

  // Validate device type
  const validDevices = ["hackrf", "hpro", "portarf"];
  if (!validDevices.includes(deviceType.toLowerCase())) {
    return new Response(
      JSON.stringify({
        error: `Invalid device type. Must be one of: ${validDevices.join(", ")}`,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let apiUrl =
    "https://api.github.com/repos/portapack-mayhem/mayhem-firmware/releases";

  let apiResponse = await fetch(apiUrl, {
    method: "GET",
    headers: { "User-Agent": "portapack-mayhem" },
  });

  if (!apiResponse.ok) {
    throw new Error(`HTTP error! status: ${apiResponse.status}`);
  }

  let apiData: any = await apiResponse.json();

  // Find the asset that matches the device type
  let asset = apiData[0].assets.find((asset: any) => {
    const assetName: string = asset["name"].toLowerCase();
    return (
      assetName.includes(".ppfw.tar") &&
      assetName.includes(deviceType.toLowerCase())
    );
  });

  // Fallback: if no device-specific asset found, just look for any .ppfw.tar file
  if (!asset) {
    console.log(
      `No device-specific firmware found for ${deviceType}, falling back to generic .ppfw.tar`,
    );
    asset = apiData[0].assets.find((asset: any) => {
      const assetName: string = asset["name"];
      return assetName.includes(".ppfw.tar");
    });
  }

  // If still no asset found, return error
  if (!asset) {
    return new Response(
      JSON.stringify({
        error: `No firmware found`,
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const browser_download_url = asset.browser_download_url;
  console.log(browser_download_url);

  const fileUrl = browser_download_url;
  const resourceResponse = await fetch(fileUrl);

  if (!resourceResponse.ok) {
    throw new Error(`HTTP error! status: ${resourceResponse.status}`);
  }

  const resourceBody = await resourceResponse.body;
  let fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

  let proxyResponse = new Response(resourceBody, resourceResponse);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    proxyResponse.headers.set(key, value);
  });
  proxyResponse.headers.set(
    "Content-Disposition",
    `attachment; filename="${fileName}"`,
  );

  return proxyResponse;
};
