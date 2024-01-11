const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS,DELETE",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json;charset=utf-8",
};

export const onRequestGet: PagesFunction = async (context) => {
  let fileUrl =
    "https://github.com/portapack-mayhem/mayhem-firmware/releases/download/nightly-tag-2024-01-11/mayhem_nightly_n_240111_OCI.ppfw.tar";

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
