import { CLIENT_ID, CHANNEL_LIST } from "./config.js";

/* Adds a link for users to authenticate with Twitch OAuth */
async function serveTwitchAuthURL() {
    const REDIRECT_URI = window.location.origin + window.location.pathname;
    const authURLParams = new URLSearchParams({
        response_type: "token",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "user:read:follows"
    }).toString();

    const authURL = `https://id.twitch.tv/oauth2/authorize?${authURLParams}`;

    const authenticateLinkEl = document.createElement("a");
    authenticateLinkEl.id = "auth-button"
    authenticateLinkEl.setAttribute("href", authURL);
    authenticateLinkEl.textContent = "Login with Twitch";

    document.getElementById("streams-container").append(authenticateLinkEl);
}

/* Fetch list of currently-live streams for the list of curated usernames. */
async function fetchStreams(token) {
    let fullStreamList = [];

    const MAX_IDS_PER_REQUEST = 100;
    for (let i = 0; i < CHANNEL_LIST.length; i+=MAX_IDS_PER_REQUEST) {
        const channelsSubset = CHANNEL_LIST.slice(i, i+MAX_IDS_PER_REQUEST);
        const channelsAsParamString = channelsSubset.map((u) => "user_login=" + u).join("&");
        const response = await fetch("https://api.twitch.tv/helix/streams?type=live&first=100&" + channelsAsParamString, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Client-Id": CLIENT_ID
            }
        });

        if (response.ok) {
            const streamList = await response.json();
            fullStreamList.push(...streamList.data);
        } else {
            console.log(`Fetching streams at index ${i} returned ${response.status} ${response.statusText}`);
        }
    }
    return fullStreamList;
}

/*
Helper function that takes the data for some stream and returns a pre-built element.
lol
*/
function createStreamElement(streamObject) {
    const channelLink = `https://www.twitch.tv/${streamObject.user_login}`;
    const thumbnailURL = streamObject.thumbnail_url.replace("{width}", "240").replace("{height}", "135");

    // MAIN ELEMENT
    const el = document.createElement("div");
    el.className = "stream-container";

    // TITLE
    const streamTitleEl = document.createElement("div");
    streamTitleEl.style.positionAnchor = `--thumbnail-anchor-${streamObject.user_login}`;
    streamTitleEl.style.bottom = `anchor(bottom)`;
    streamTitleEl.className = "stream-title";
    streamTitleEl.textContent = streamObject.title;

    // THUMBNAIL
    const thumbnailCtr = document.createElement("a");
    thumbnailCtr.className = "thumbnail-container";
    thumbnailCtr.style.anchorName = `--thumbnail-anchor-${streamObject.user_login}`;
    thumbnailCtr.setAttribute("target", "_blank");
    thumbnailCtr.setAttribute("href", channelLink);
    const thumbnailImgEl = document.createElement("img");
    thumbnailImgEl.className = "thumbnail";
    thumbnailImgEl.setAttribute("src", thumbnailURL);
    thumbnailCtr.append(thumbnailImgEl);

    thumbnailCtr.append(streamTitleEl);

    // CHANNEL NAME
    const channelNameEl = document.createElement("a");
    channelNameEl.setAttribute("target", "_blank");
    channelNameEl.setAttribute("href", channelLink);
    channelNameEl.textContent = streamObject.user_name;

    // VIEWER COUNT
    const viewerCountEl = document.createElement("span");
    viewerCountEl.textContent = `${streamObject.viewer_count} viewers (${streamObject.language})`

    // TOP LINE
    const topLineCtr = document.createElement("div");
    topLineCtr.className = "stream-top-line";
    topLineCtr.append(channelNameEl);
    topLineCtr.append(" · ");
    topLineCtr.append(viewerCountEl);

    // GAME NAME
    const gameNameEl = document.createElement("div");
    gameNameEl.textContent = streamObject.game_name;

    el.append(thumbnailCtr);
    el.append(topLineCtr);
    el.append(gameNameEl);

    return el;
}

// TODO: Access denied and redirect mismatch should be handled
async function handleTokenLogic() {
    let token;
    const hashTokenRegex = /#access_token=([a-z0-9]+)/;
    const hashTokenMatch = hashTokenRegex.exec(window.location.hash);

    if (hashTokenMatch) {
        token = hashTokenMatch[1];
        localStorage.setItem("access_token", token);
        window.history.replaceState({}, "", window.location.origin + window.location.pathname);
    } else {
        token = localStorage.getItem("access_token");
    }

    return token;
}

function buildStreamListing(streamObjList, sortMethod="random") {
    //TODO
}

/*
Main execution function

TODO: filter based on keywords (e.g. remove rando streams)
*/
window.onload = async () => {
    document.getElementById("streams-container").textContent = "";
    const token = await handleTokenLogic();
    if (token) {
        const streamList = await fetchStreams(token);
        streamList.sort((a, b) => Math.random()-0.5);
        streamList.forEach(s => {
            const streamEl = createStreamElement(s);
            document.getElementById("streams-container").appendChild(streamEl);
        });
    } else {
        serveTwitchAuthURL();
    }
};