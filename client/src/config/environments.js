// src/config/environments.js
import sfLogo from "../assets/sf.png";
import sfoaLogo from "../assets/sfoa.png";

export const ENVIRONMENTS = {
    SALESFORCE: {
        id: "salesforce",
        name: "Salesforce",
        loginUrl: "https://login.salesforce.com",
        icon: sfLogo,
    },
    SFOA: {
        id: "sfoa",
        name: "Salesforce on Alibaba Cloud",
        loginUrl: "https://login.sfcrmproducts.cn",
        icon: sfoaLogo,
    },
};

export const DEFAULT_ENVIRONMENT = ENVIRONMENTS.SALESFORCE;
