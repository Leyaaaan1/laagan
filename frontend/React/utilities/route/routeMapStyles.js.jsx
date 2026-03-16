const routeMapStyles = `
     body {
                margin: 0;
                padding: 0;
                background-color: #fff;
            }
            #map {
                height: 100vh;
                width: 100vw;
                border-radius: 10px;
            }
            .error-message {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(239, 68, 68, 0.9);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                z-index: 1000;
                max-width: 80%;
            }
            .route-popup {
                font-size: 14px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.98);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                border: 2px solid;
                min-width: 150px;
            }
            .route-popup strong {
                display: block;
                margin-bottom: 4px;
                font-size: 15px;
            }
            .route-popup b {
                color: #1e40af;
            }
            /* Custom marker styles */
            .custom-marker {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 16px;
                color: white;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                border: 3px solid white;
                transition: transform 0.2s;
            }
            .custom-marker:hover {
                transform: scale(1.2);
            }
            .marker-start {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            }
            .marker-stop {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            }
            .marker-end {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            }
            /* User location marker */
            .user-location-marker {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #2563eb;
                border: 3px solid white;
                box-shadow: 0 0 15px rgba(37, 99, 235, 0.6);
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% {
                    box-shadow: 0 0 15px rgba(37, 99, 235, 0.6);
                }
                50% {
                    box-shadow: 0 0 25px rgba(37, 99, 235, 0.8);
                }
                100% {
                    box-shadow: 0 0 15px rgba(37, 99, 235, 0.6);
                }
            }
            .user-location-accuracy {
                border-radius: 50%;
                background: rgba(37, 99, 235, 0.15);
                border: 2px solid rgba(37, 99, 235, 0.3);
            }
            .location-name-label {
                background: white;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                border: 2px solid;
                white-space: nowrap;
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
`;
export default routeMapStyles;