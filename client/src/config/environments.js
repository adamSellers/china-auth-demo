// src/config/environments.js
export const ENVIRONMENTS = {
    SALESFORCE: {
        id: "salesforce",
        name: "Salesforce",
        loginUrl: "https://login.salesforce.com",
        clientIdKey: "VITE_SF_CLIENT_ID",
        icon: "/src/assets/sf.png", // 90x32px logo
    },
    SFOA: {
        id: "sfoa",
        name: "Salesforce on Alibaba Cloud",
        loginUrl: "https://login.sfcrmproducts.cn",
        clientIdKey: "VITE_SFOA_CLIENT_ID",
        icon: "/src/assets/sfoa.png", // 90x32px logo
    },
};

export const DEFAULT_ENVIRONMENT = ENVIRONMENTS.SALESFORCE;
