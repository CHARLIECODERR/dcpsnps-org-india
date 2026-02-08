// src/services/locationApi.js

const API_KEY = "8fd41a881172efd68fa039106860fc8e309f034b27926ce4504665328a768489";
const BASE_URL = "https://api.countrystatecity.in/v1";

const headers = {
  "X-CSCAPI-KEY": API_KEY,
};

export function getStatesOfIndia() {
  return fetch(`${BASE_URL}/countries/IN/states`, { headers })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch states");
      return res.json();
    });
}

export function getDistrictsOfState(stateIso) {
  return fetch(
    `${BASE_URL}/countries/IN/states/${stateIso}/cities`,
    { headers }
  ).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch districts");
    return res.json();
  });
}
