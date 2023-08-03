const { createApp, ref } = Vue;

//key that short links will be saved under
const storageKey = "links";

//wrapper to store and pull objects from local storage
const storage = {
  save: function (key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get: function (key) {
    return JSON.parse(localStorage.getItem(key));
  },
};

async function fetchShortUrl(url) {
  const response = await fetch(`https://api.shrtco.de/v2/shorten?url=${url}`);
  const json = await response.json();

  return json;
}

function urlIsValid(url) {
  const regExp =
    /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9\-]+(\.[a-z\-]{2,}){1,3}(#?\/?[a-zA-Z0-9\-#]+)*\/?(\?[a-zA-Z0-9-_\-]+=[a-zA-Z0-9-%\-]+&?)?$/;
  return url.match(regExp);
}

function copyShortLink(e, url) {
  navigator.clipboard.writeText(url);

  e.target.innerText = "Copied";
  e.target.classList.add("shortener__copy--copied");
  e.target.disabled = true;

  setTimeout(() => {
    e.target.innerText = "Copy";
    e.target.classList.remove("shortener__copy--copied");
    e.target.disabled = false;
  }, 3000);
}

function formatLinkData(json) {
  const originalLink = json.result.original_link;
  const shortLink = json.result.full_short_link;
  const desktopLink = originalLink.length > 50 ? `${originalLink.slice(0, 50)}...` : originalLink;
  const mobileLink = originalLink.length > 35 ? `${originalLink.slice(0, 35)}...` : originalLink;

  console.log(desktopLink);

  const linkData = {
    desktop: desktopLink,
    mobile: mobileLink,
    short: shortLink,
    original: originalLink,
  };

  return linkData;
}

//setup up vue app
createApp({
  setup() {
    //state variables
    const state = ref({
      isLoading: false,
      mobileNavOpen: false,
      inputUrl: "",
      inputIsInvalid: false,
      shortenedLinks: storage.get(storageKey) || [],
      onFormSubmit,
      hideError,
      copyShortLink,
      toggleMobileNav,
    });

    //add link to state + storage
    function addNewLink(newLink) {
      state.value.shortenedLinks = [newLink, ...state.value.shortenedLinks];
      storage.save(storageKey, state.value.shortenedLinks);
    }

    //error state functions for form
    function showError() {
      state.value.inputIsInvalid = true;
    }

    function hideError() {
      if (state.value.inputIsInvalid) {
        state.value.inputIsInvalid = false;
      }
    }

    function toggleMobileNav() {
      state.value.mobileNavOpen = !state.value.mobileNavOpen;
    }

    function toggleLoading() {
      state.value.isLoading = !state.value.isLoading;
    }

    function clearInput() {
      state.value.inputUrl = "";
    }

    async function onFormSubmit(e) {
      e.preventDefault();

      if (urlIsValid(state.value.inputUrl)) {
        toggleLoading();

        const json = await fetchShortUrl(state.value.inputUrl);

        const linkData = formatLinkData(json);

        addNewLink(linkData);

        toggleLoading();
        clearInput();
      } else {
        showError();
      }
    }

    return { state };
  },
}).mount("body");
