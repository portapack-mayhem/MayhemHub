const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,OPTIONS,DELETE",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

export const onRequestGet: PagesFunction = async (context) => {
  const convertNightlyString = (nightlyTag: string) => {
    const parts = nightlyTag.split("-");

    // We expect the input to be 'nightly-tag-YYYY-MM-DD' format
    const year = parts[2].slice(2); // remove '20' prefix from the year
    const month = parts[3];
    const day = parts[4];

    return `n_${year}${month}${day}`;
  };

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

  const latestNightlyObject = apiData.find(
    (item: any) => item.prerelease === true
  );
  const nightlyVersion = convertNightlyString(latestNightlyObject.tag_name);

  const latestStableObject = apiData.find(
    (item: any) => item.prerelease === false
  );

  const data = {
    latest_stable: latestStableObject.tag_name,
    latest_nightly: nightlyVersion,
  };

  const json = JSON.stringify(data);

  return new Response(json, {
    headers: {
      ...corsHeaders,
      "content-type": "application/json;charset=UTF-8",
    },
  });
};
