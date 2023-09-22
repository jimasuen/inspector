const extractData = document.getElementById("extractData");
const lnregex = /@/;
const pouchregex = /pouch\.ph/;
let url;
let jsonString;
let jsonObject;
let lnurlText = document.getElementById("lnurlText");
let jsonData = document.getElementById("jsonData");
let parsedMetadata = document.getElementById("parsedMetadata");
let descriptionHash = document.getElementById("descriptionHash");

extractData.addEventListener("click", async () => {
  resetValues();

  if (lnregex.test(lnurlText.value)) {
    // it's a lightning address
    const lnarray = lnurlText.value.split("@");

    if (pouchregex.test(lnarray[1])) {
      url = "https://app." + lnarray[1] + "/.well-known/lnurlp/" + lnarray[0];
    } else {
      url = "https://" + lnarray[1] + "/.well-known/lnurlp/" + lnarray[0];
    }

    setValues(url);
  } else if (lnurlText.value.toLowerCase().startsWith("lnurl")) {
    // it's an lnurl

    const data = '{"data" : "' + lnurlText.value + '"}';

    async function decode() {
      try {
        const decodedata = await fetch(
          "https://legend.lnbits.com/api/v1/payments/decode",
          {
            method: "POST",
            headers: {
              "X-Api-Key": "cce9b14305d64f3c93736a1ef12eb265",
              "Content-type": "application/json",
            },
            body: data,
          }
        );

        if (decodedata.ok) {
          return decodedata.text();
        }
      } catch (error) {
        return null;
      }
    }

    try {
      const domainString = await decode();
      const domainObject = JSON.parse(domainString);

      url = domainObject.domain;

      setValues(url);
    } catch (error) {
      jsonData.innerHTML = "Error";
    }
  } else {
    // it's neither so do nothing
    jsonData.innerHTML = "Value is neither a lightning address nor LNURL";
  }
});

async function resp(url) {
  try {
    const response = await fetch(
      "https://corsproxy.io/?" + encodeURIComponent(url)
    );
    if (response.ok) {
      return response.text();
    } else {
      jsonData.innerHTML = response.status;
    }
  } catch (error) {}
}

async function setValues(url) {
  try {
    jsonString = await resp(url);

    jsonObject = JSON.parse(jsonString);

    jsonData.innerHTML = jsonString;
    parsedMetadata.innerHTML = jsonObject.metadata;
    descriptionHash.innerHTML = await createhash(jsonObject.metadata);
  } catch (error) {
    jsonData.innerHTML = "Error";
  }
}

async function createhash(data) {
  const utf8encode = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", utf8encode);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

function resetValues() {
  jsonData.innerHTML = "";
  parsedMetadata.innerHTML = "";
  descriptionHash.innerHTML = "";
}