const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,OPTIONS,DELETE",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

export const onRequestGet: PagesFunction = async (context) => {
  let apiUrl =
    "https://api.github.com/repos/portapack-mayhem/mayhem-firmware/releases/latest";

  let apiResponse = await fetch(apiUrl, {
    method: "GET",
    headers: { "User-Agent": "portapack-mayhem" },
  });

  if (!apiResponse.ok) {
    throw new Error(`HTTP error! status: ${apiResponse.status}`);
  }

  let apiData: any = await apiResponse.json();
  // assuming you want to fetch the first release data
  let browser_download_url = apiData.assets.find((asset: any) => {
    const assetName: string = asset["name"];
    return assetName.includes(".ppfw.tar");
  }).browser_download_url;
  console.log(browser_download_url);

  let fileUrl = browser_download_url;

  let response = await fetch(fileUrl, context.request);

  let fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

  // You can modify the response here, like setting content-disposition to force a file download
  response = new Response(response.body, response);
  response.headers.set(
    "Content-Disposition",
    `attachment; filename="${fileName}"`
  );

  return response;
};
