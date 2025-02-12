const ProdApi_stagingUrl =
  // "https://localhost:7049/Api";
  "https://kidcarehealthpointapistaging.azurewebsites.net/Api";
export function baseAPI() {
  return ProdApi_stagingUrl;
  // const currentUrl = window.location.href;
  // if (currentUrl.includes("KidCare_Staging")) {
  //   return ProdApi_stagingUrl;
  // } else {
  //   return ProdApi_baseurl;
  // }
}

export function baseURL() {
  const currentUrl = window.location.href;
  const urlObject = new URL(currentUrl);
  const baseUrl = `${urlObject.protocol}//${
    urlObject.hostname
  }${urlObject.pathname.replace(/\/[^\/]*$/, "")}`;
  console.log(baseUrl);
  return baseUrl;
}
