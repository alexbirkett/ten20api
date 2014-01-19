module.exports = {
    settings: {
        password: {
            type: "string",
            pattern: "^[0-9]{6}$"
        },
        authorizedNumbers: {
            type: "array",
            count: 5,
            elements: {
                type: "string",
                pattern: "^\\+([0-9])*$"
            }
        },
        tracking: {
            enabled: {
                type: "boolean"
            },
            updateInterval: {
                type: "string",
                pattern: "^[0-9]{1,3}[s|S|m|M|h|H]$"
            }
        },
        timeZone: {
            type: "string",
            pattern: "^(\\+|-)[0-9]{2}$"
        },
        lowBatteryAlarm: {
            enabled: {
                type: "boolean"
            },
            percentage: {
                type: "string",
                pattern: "^[0-9]{2}$"
            }
        },
        acc: {
            enabled: {
                type: "boolean"
            }
        },
        listenMode: {
            enabled: {
                type: "boolean"
            }
        },
        apnAndServer: {
            ipAddress: {
                type: "string",
                pattern: "^[0-9]{1,3}\\.([0-9]){1,3}\\.([0-9]){1,3}\\.([0-9]){1,3}$"
            },
            port: {
                type: "string",
                pattern: "^[0-9]{1,5}$" // 65535
            },
            apn: {
                type: "string"
            }
        },
        apnUserNameAndPassword: {
            apnUserName: {
                type: "string"
            },
            apnPassword: {
                type: "string"
            }
        },
        speedingAlarm: {
            enabed: {
                type: "boolean"
            },
            speed: {
                type: "string"
            }
        }
    },
    messages: {
        location: {
            available: "boolean",
            timestamp: "timestamp",
            latitude: "number",
            longitude: "number",
            speed: "number",
            status: {
                batteryLife: "number",
                gsmSignal: "number"
            },
            network: {
                countryCode: "number",
                networkCode: "number",
                locationAreaCode: "number",
                cellId: "number"
            }
        }
    }

};

