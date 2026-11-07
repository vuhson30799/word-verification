import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
    ...nextCoreWebVitals,
    {
        rules: {
            "react/react-in-jsx-scope": "off",
            "no-unused-vars": "warn",
            "react-hooks/refs": "warn",
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/immutability": "warn"
        }
    }
];
