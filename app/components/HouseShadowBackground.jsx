import React, { memo, useEffect, useRef, useState } from 'react';
import './HouseShadowBackground.css';
import { skyCloudsSvgMarkup } from './skySilhouetteSvg';

const SMALL_STAR_VIEWBOX = {
    minX: 0,
    maxX: 1440,
    minY: -100,
    maxY: 200
};

const SMALL_STAR_COUNT = 720;
const SMALL_STAR_MIN_DISTANCE = 6;
const REACTIVE_STAR_BAND = {
    minY: 6,
    maxY: 150
};
function createSeededRandom(seed) {
    let value = seed >>> 0;

    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
    };
}

function generateSmallStars() {
    const random = createSeededRandom(0x5eed1234);
    const stars = [];
    const maxAttempts = SMALL_STAR_COUNT * 80;

    for (let attempt = 0; attempt < maxAttempts && stars.length < SMALL_STAR_COUNT; attempt += 1) {
        const radius = Number((0.25 + (random() * 0.75)).toFixed(2));
        const x = Number((SMALL_STAR_VIEWBOX.minX + random() * (SMALL_STAR_VIEWBOX.maxX - SMALL_STAR_VIEWBOX.minX)).toFixed(2));
        const y = Number((SMALL_STAR_VIEWBOX.minY + random() * (SMALL_STAR_VIEWBOX.maxY - SMALL_STAR_VIEWBOX.minY)).toFixed(2));

        const overlapsAnotherStar = stars.some((star) => {
            const minDistance = SMALL_STAR_MIN_DISTANCE + ((star.r + radius) * 4);
            return Math.hypot(star.cx - x, star.cy - y) < minDistance;
        });

        if (overlapsAnotherStar) {
            continue;
        }

        stars.push({
            cx: x,
            cy: y,
            r: radius
        });
    }

    return stars;
}

const smallStars = generateSmallStars();
const bandCandidateStars = smallStars.filter((star) => star.cy >= REACTIVE_STAR_BAND.minY && star.cy <= REACTIVE_STAR_BAND.maxY);
const reactiveSmallStars = bandCandidateStars.filter((_, index) => index % 3 === 0);
const ambientSmallStars = smallStars.filter((star) => !reactiveSmallStars.includes(star));
const ambientStarBuckets = [0, 1, 2].map((bucketIndex) => ambientSmallStars.filter((_, starIndex) => (starIndex % 3) === bucketIndex));
const ambientStarPaths = ambientStarBuckets.map((bucket) => buildStarCirclePath(bucket));

function findFirstStarIndex(starMetrics, minX) {
    let low = 0;
    let high = starMetrics.length;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);

        if (starMetrics[mid].centerX < minX) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }

    return low;
}

function isPointInsideEllipse(x, y, ellipse) {
    const normalizedX = (x - ellipse.cx) / ellipse.rx;
    const normalizedY = (y - ellipse.cy) / ellipse.ry;
    return (normalizedX * normalizedX) + (normalizedY * normalizedY) <= 1;
}

function countOutsideEllipseSamples(x, y, sampleOffsets, ellipses) {
    return sampleOffsets.reduce((count, offset) => {
        const sampleX = x + offset.x;
        const sampleY = y + offset.y;
        const insideAnyEllipse = ellipses.some((ellipse) => isPointInsideEllipse(sampleX, sampleY, ellipse));
        return count + (insideAnyEllipse ? 0 : 1);
    }, 0);
}

function getCloudGap(firstBounds, secondBounds) {
    const horizontalGap = Math.max(
        0,
        Math.max(firstBounds.left - secondBounds.right, secondBounds.left - firstBounds.right)
    );
    const verticalGap = Math.max(
        0,
        Math.max(firstBounds.top - secondBounds.bottom, secondBounds.top - firstBounds.bottom)
    );

    return Math.hypot(horizontalGap, verticalGap);
}

function buildStarCirclePath(stars) {
    return stars.map((star) => {
        const leftX = (star.cx - star.r).toFixed(2);
        const centerY = star.cy.toFixed(2);
        const diameter = (star.r * 2).toFixed(2);
        const radius = star.r.toFixed(2);
        return `M ${leftX} ${centerY} a ${radius} ${radius} 0 1 0 ${diameter} 0 a ${radius} ${radius} 0 1 0 -${diameter} 0`;
    }).join(' ');
}

const HouseShadowBackground = memo(() => {
    const [cloudDropReady, setCloudDropReady] = useState(false);
    const [cloudDropComplete, setCloudDropComplete] = useState(false);
    const [cloudLoopDistance, setCloudLoopDistance] = useState(0);
    const firstCloudLayerRef = useRef(null);
    const cloudOverlayRef = useRef(null);
    const starSvgRef = useRef(null);
    const starVisibilityFrameRef = useRef(null);
    const starMetricsRef = useRef([]);
    const previouslyOccludedStarsRef = useRef([]);
    const previousCloudBoundsRef = useRef({ minX: null, maxX: null });
    const lastStarVisibilityUpdateRef = useRef(0);

    useEffect(() => {
        const animationFrameId = window.requestAnimationFrame(() => {
            setCloudDropReady(true);
        });
        const timeoutId = window.setTimeout(() => {
            setCloudDropComplete(true);
        }, 3600);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        const layerGap = 0;

        const updateCloudLoopDistance = () => {
            if (!firstCloudLayerRef.current) {
                return;
            }

            const nextDistance = Math.max(firstCloudLayerRef.current.offsetWidth + layerGap, 0);
            setCloudLoopDistance(nextDistance);
        };

        updateCloudLoopDistance();

        let resizeObserver;

        if (typeof ResizeObserver !== 'undefined' && firstCloudLayerRef.current) {
            resizeObserver = new ResizeObserver(() => {
                updateCloudLoopDistance();
            });

            resizeObserver.observe(firstCloudLayerRef.current);
        }

        window.addEventListener('resize', updateCloudLoopDistance);

        return () => {
            window.removeEventListener('resize', updateCloudLoopDistance);

            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof DOMPoint === 'undefined') {
            return undefined;
        }

        const svgRoot = starSvgRef.current;
        const cloudOverlay = cloudOverlayRef.current;

        if (!svgRoot || !cloudOverlay) {
            return undefined;
        }

        const starElements = Array.from(svgRoot.querySelectorAll('.stars-twinkle circle[data-reactive-star="true"]'));
        const cloudPaths = Array.from(cloudOverlay.querySelectorAll('.sky-cloud path, path.sky-cloud'));
        const edgeSampleOffsets = [
            { x: 0, y: -7 },
            { x: 7, y: 0 },
            { x: 0, y: 7 },
            { x: -7, y: 0 }
        ];

        if (!starElements.length || !cloudPaths.length) {
            return undefined;
        }

        const updateStarMetrics = () => {
            starMetricsRef.current = starElements
                .map((starElement) => {
                    const starBounds = starElement.getBoundingClientRect();
                    return {
                        element: starElement,
                        centerX: starBounds.left + (starBounds.width / 2),
                        centerY: starBounds.top + (starBounds.height / 2)
                    };
                })
                .sort((leftStar, rightStar) => leftStar.centerX - rightStar.centerX);
        };

        const updateCloudDepthClasses = () => {
            const cloudMetrics = cloudPaths
                .map((cloudPath) => {
                    const bounds = cloudPath.getBoundingClientRect();

                    return {
                        element: cloudPath,
                        bounds,
                        area: bounds.width * bounds.height
                    };
                })
                .filter(({ bounds }) => bounds.width > 0 && bounds.height > 0);

            if (!cloudMetrics.length) {
                return;
            }

            const sortedAreas = [...cloudMetrics]
                .map(({ area }) => area)
                .sort((leftArea, rightArea) => leftArea - rightArea);
            const smallAreaThreshold = sortedAreas[Math.max(0, Math.floor(sortedAreas.length * 0.38) - 1)] ?? sortedAreas[sortedAreas.length - 1];

            cloudMetrics.forEach((cloudMetric, cloudIndex) => {
                const nearestGap = cloudMetrics.reduce((closestGap, otherMetric, otherIndex) => {
                    if (cloudIndex === otherIndex) {
                        return closestGap;
                    }

                    return Math.min(closestGap, getCloudGap(cloudMetric.bounds, otherMetric.bounds));
                }, Number.POSITIVE_INFINITY);
                const isolationThreshold = Math.max(cloudMetric.bounds.width, cloudMetric.bounds.height) * 0.72;
                const isSmallIsolatedCloud = cloudMetric.area <= smallAreaThreshold && nearestGap > isolationThreshold;

                cloudMetric.element.classList.toggle('sky-cloud-distant', isSmallIsolatedCloud);
            });
        };

        updateStarMetrics();
        updateCloudDepthClasses();
        previousCloudBoundsRef.current = { minX: null, maxX: null };
        lastStarVisibilityUpdateRef.current = 0;

        let resizeObserver;

        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                updateStarMetrics();
                updateCloudDepthClasses();
                previousCloudBoundsRef.current = { minX: null, maxX: null };
                lastStarVisibilityUpdateRef.current = 0;
            });

            resizeObserver.observe(svgRoot);
            resizeObserver.observe(cloudOverlay);
        }

        const handleWindowResize = () => {
            updateStarMetrics();
            updateCloudDepthClasses();
            previousCloudBoundsRef.current = { minX: null, maxX: null };
            lastStarVisibilityUpdateRef.current = 0;
        };

        window.addEventListener('resize', handleWindowResize);

        const updateStarVisibility = (timestamp = 0) => {
            if (timestamp - lastStarVisibilityUpdateRef.current < 120) {
                starVisibilityFrameRef.current = window.requestAnimationFrame(updateStarVisibility);
                return;
            }

            lastStarVisibilityUpdateRef.current = timestamp;

            const activeClouds = cloudPaths.reduce((visibleClouds, cloudPath) => {
                const bounds = cloudPath.getBoundingClientRect();

                if (bounds.width <= 0 || bounds.height <= 0) {
                    return visibleClouds;
                }

                const centerX = bounds.left + (bounds.width / 2);
                const centerY = bounds.top + (bounds.height / 2);
                const width = bounds.width;
                const height = bounds.height;
                const outerEllipses = [
                    { cx: centerX - (width * 0.22), cy: centerY + (height * 0.02), rx: Math.max(width * 0.2, 18), ry: Math.max(height * 0.24, 14) },
                    { cx: centerX, cy: centerY - (height * 0.08), rx: Math.max(width * 0.24, 22), ry: Math.max(height * 0.28, 16) },
                    { cx: centerX + (width * 0.22), cy: centerY + (height * 0.02), rx: Math.max(width * 0.2, 18), ry: Math.max(height * 0.24, 14) }
                ];
                const innerEllipses = outerEllipses.map((ellipse) => ({
                    cx: ellipse.cx,
                    cy: ellipse.cy,
                    rx: Math.max(ellipse.rx * 0.72, 12),
                    ry: Math.max(ellipse.ry * 0.7, 10)
                }));

                visibleClouds.push({
                    bounds,
                    outerEllipses,
                    innerEllipses
                });

                return visibleClouds;
            }, []);

            previouslyOccludedStarsRef.current.forEach((starElement) => {
                starElement.style.fillOpacity = '';
            });

            if (!activeClouds.length) {
                previouslyOccludedStarsRef.current = [];
                starVisibilityFrameRef.current = window.requestAnimationFrame(updateStarVisibility);
                return;
            }

            const minCloudX = activeClouds.reduce((currentMin, cloud) => Math.min(currentMin, cloud.bounds.left - 8), Number.POSITIVE_INFINITY);
            const maxCloudX = activeClouds.reduce((currentMax, cloud) => Math.max(currentMax, cloud.bounds.right + 8), Number.NEGATIVE_INFINITY);
            const previousCloudBounds = previousCloudBoundsRef.current;
            const cloudShift = previousCloudBounds.minX === null
                ? Number.POSITIVE_INFINITY
                : Math.max(
                    Math.abs(minCloudX - previousCloudBounds.minX),
                    Math.abs(maxCloudX - previousCloudBounds.maxX)
                );

            if (cloudShift < 5) {
                starVisibilityFrameRef.current = window.requestAnimationFrame(updateStarVisibility);
                return;
            }

            previousCloudBoundsRef.current = { minX: minCloudX, maxX: maxCloudX };

            const candidateStartIndex = findFirstStarIndex(starMetricsRef.current, minCloudX);
            const nextOccludedStars = [];

            for (let index = candidateStartIndex; index < starMetricsRef.current.length; index += 1) {
                const { element, centerX, centerY } = starMetricsRef.current[index];

                if (centerX > maxCloudX) {
                    break;
                }

                let occlusionOpacity = 1;

                activeClouds.forEach((cloud) => {
                    if (centerX < cloud.bounds.left || centerX > cloud.bounds.right || centerY < cloud.bounds.top || centerY > cloud.bounds.bottom) {
                        return;
                    }

                    const insideInnerCloud = cloud.innerEllipses.some((ellipse) => isPointInsideEllipse(centerX, centerY, ellipse));

                    if (insideInnerCloud) {
                        occlusionOpacity = 0;
                        return;
                    }

                    const insideOuterCloud = cloud.outerEllipses.some((ellipse) => isPointInsideEllipse(centerX, centerY, ellipse));

                    if (!insideOuterCloud) {
                        return;
                    }

                    const outsideSamples = countOutsideEllipseSamples(centerX, centerY, edgeSampleOffsets, cloud.outerEllipses);
                    const edgeOpacity = outsideSamples / edgeSampleOffsets.length;
                    occlusionOpacity = Math.min(occlusionOpacity, edgeOpacity);
                });

                if (occlusionOpacity < 1) {
                    element.style.fillOpacity = occlusionOpacity.toFixed(2);
                    nextOccludedStars.push(element);
                }
            }

            previouslyOccludedStarsRef.current = nextOccludedStars;

            starVisibilityFrameRef.current = window.requestAnimationFrame(updateStarVisibility);
        };

        starVisibilityFrameRef.current = window.requestAnimationFrame(updateStarVisibility);

        return () => {
            window.removeEventListener('resize', handleWindowResize);

            if (resizeObserver) {
                resizeObserver.disconnect();
            }

            if (starVisibilityFrameRef.current) {
                window.cancelAnimationFrame(starVisibilityFrameRef.current);
            }

            previouslyOccludedStarsRef.current.forEach((starElement) => {
                starElement.style.fillOpacity = '';
            });
            previouslyOccludedStarsRef.current = [];
            previousCloudBoundsRef.current = { minX: null, maxX: null };
        };
    }, [cloudLoopDistance]);

    return (
        <div className="house-shadow-container">
            <div className="sky-layer">
                {/* Decorative Stars */}
                <div className="star" style={{ top: '6%', left: '12%', width: '2px', height: '2px', animationDelay: '0s' }}></div>
                <div className="star" style={{ top: '10%', left: '28%', width: '3px', height: '3px', animationDelay: '0.5s' }}></div>
                <div className="star" style={{ top: '4%', left: '45%', width: '2px', height: '2px', animationDelay: '1s' }}></div>
                <div className="star" style={{ top: '14%', left: '62%', width: '2px', height: '2px', animationDelay: '1.5s' }}></div>
                <div className="star" style={{ top: '8%', left: '78%', width: '3px', height: '3px', animationDelay: '2s' }}></div>
                <div className="star" style={{ top: '18%', left: '88%', width: '2px', height: '2px', animationDelay: '2.5s' }}></div>
                <div className="star" style={{ top: '12%', left: '95%', width: '2px', height: '2px', animationDelay: '3s' }}></div>
                <div className="star" style={{ top: '20%', left: '5%', width: '2px', height: '2px', animationDelay: '3.5s' }}></div>
                <div className="star" style={{ top: '16%', left: '52%', width: '2px', height: '2px', animationDelay: '4s' }}></div>

                {/* Shooting Stars */}
                <div className="shooting-stars-container">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`shooting-star-group star-${i + 1}`}>
                            <svg className="shooting-star-svg" viewBox="0 0 200 2" preserveAspectRatio="none">
                                <rect
                                    x="0"
                                    y="0"
                                    width="200"
                                    height="2"
                                    fill="url(#shootingStarGradient)"
                                    className="shooting-star-trail"
                                />
                            </svg>
                            <div className="shooting-star-head"></div>
                        </div>
                    ))}
                </div>

                <svg
                    ref={starSvgRef}
                    className="sky-stars-svg"
                    viewBox="0 -100 1440 300"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMin slice"
                    aria-hidden="true"
                >
                    <g className="stars-twinkle animate-entrance-top delay-1500" fill="white" opacity="0.8">
                        {ambientStarPaths.map((pathData, index) => (
                            <path key={`ambient-stars-${index}`} d={pathData} className={`ambient-stars-path ambient-stars-path-${index + 1}`} />
                        ))}
                        {reactiveSmallStars.map((star, index) => (
                            <circle
                                key={`${star.cx}-${star.cy}-${index}`}
                                cx={star.cx}
                                cy={star.cy}
                                r={star.r}
                                data-reactive-star="true"
                            />
                        ))}
                    </g>
                </svg>

                <div
                    ref={cloudOverlayRef}
                    className={`sky-silhouette-overlay${cloudDropReady ? ' cloud-drop-ready' : ''}${cloudDropComplete ? ' cloud-drop-complete' : ''}`}
                    aria-hidden="true"
                >
                    <div className="sky-silhouette-track">
                        <div
                            className="sky-silhouette-track-inner"
                            style={{ '--sky-loop-distance': `${cloudLoopDistance}px` }}
                        >
                            {[0, 1].map((copyIndex) => (
                                <div
                                    key={copyIndex}
                                    ref={copyIndex === 0 ? firstCloudLayerRef : null}
                                    className="sky-silhouette-svg-wrapper sky-silhouette-clouds"
                                    dangerouslySetInnerHTML={{ __html: skyCloudsSvgMarkup }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <svg viewBox="0 -100 1440 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin slice">
                    <defs>
                        <linearGradient id="shootingStarGradient" x1="1" y1="0" x2="0" y2="0">
                            <stop offset="0%" stopColor="rgba(255, 255, 255, 1)" />
                            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                        </linearGradient>
                        <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <filter id="cloudBlur" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
                        </filter>
                    </defs>
                </svg>

                <div className="airplane-layer animate-entrance-top delay-1200" aria-hidden="true">
                    <div className="airplane-fly">
                        <svg className="airplane-svg" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                            <g transform="translate(12 12) scale(0.68)">
                                <g fill="#1b2d3b" opacity="0.96">
                                    <path d="M42,21 C52,21 52,29 42,29 L28,55 A 2.5 2.5 0 0 1 23,55 L32,29 L16,28 L6,38 A 1.5 1.5 0 0 1 2,38 L10,27 L5,25 L10,23 L2,12 A 1.5 1.5 0 0 1 6,12 L16,22 L32,21 L23,-5 A 2.5 2.5 0 0 1 28,-5 L42,21 Z" />
                                    <ellipse cx="41" cy="23" rx="7" ry="4" fill="#1b2d3b" opacity="1" />
                                </g>
                                <circle cx="2" cy="38" r="3" className="airplane-light airplane-light-red" />
                                <circle cx="4" cy="12" r="3" className="airplane-light airplane-light-white" style={{ animationDelay: '0.5s' }} />
                            </g>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="city-layer house-silhouette">
                <svg viewBox="0 0 1440 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice">
                    <defs>
                        <linearGradient id="skylineGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#1a2d42" />
                            <stop offset="100%" stopColor="#152538" />
                        </linearGradient>
                        <linearGradient id="skylineGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#142436" />
                            <stop offset="100%" stopColor="#0f1c2a" />
                        </linearGradient>
                        <linearGradient id="skylineGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0c1820" />
                            <stop offset="100%" stopColor="#080f15" />
                        </linearGradient>
                        <linearGradient id="fogGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(30,58,95,0)" />
                            <stop offset="100%" stopColor="rgba(30,58,95,0.4)" />
                        </linearGradient>
                        <linearGradient id="lightBeamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(255, 220, 150, 0.6)" />
                            <stop offset="100%" stopColor="rgba(255, 220, 150, 0)" />
                        </linearGradient>
                    </defs>
                    {/* Cranes removed for cleaner silhouette */}
                    <g className="animate-entrance-bottom delay-0">
                        <path d="M0,500 L0,200 L40,200 L40,130 L60,130 L60,200 L110,200 L110,90 L140,90 L140,200 L190,200 L190,50 L230,50 L230,200 L270,200 L270,120 L310,120 L310,200 L350,200 L350,70 L400,70 L400,200 L440,200 L440,145 L480,145 L480,200 L520,200 L520,45 L580,45 L580,200 L620,200 L620,110 L660,110 L660,200 L700,200 L700,70 L740,70 L740,200 L780,200 L780,100 L820,100 L820,200 L860,200 L860,35 L920,35 L920,200 L960,200 L960,120 L1000,120 L1000,200 L1040,200 L1040,70 L1080,70 L1080,200 L1120,200 L1120,100 L1160,100 L1160,200 L1200,200 L1200,45 L1260,45 L1260,200 L1300,200 L1300,110 L1340,110 L1340,200 L1380,200 L1380,80 L1420,80 L1420,200 L1440,200 L1440,500 Z" fill="url(#skylineGradient1)" opacity="1" />
                    </g>
                    <g fill="rgba(255,200,100,0.04)" className="animate-entrance-bottom delay-0">
                        {/* x:190, y:50 */}
                        <rect x="202" y="75" width="8" height="12" rx="1" />
                        <rect x="215" y="75" width="8" height="12" rx="1" />
                        <rect x="202" y="100" width="8" height="12" rx="1" />
                        <rect x="215" y="100" width="8" height="12" rx="1" className="tv-effect" style={{ animationDelay: '4.5s' }} />

                        {/* x:350, y:70 */}
                        <rect x="362" y="90" width="8" height="12" rx="1" />
                        <rect x="378" y="90" width="8" height="12" rx="1" />

                        {/* x:520, y:45 */}
                        <rect x="535" y="70" width="10" height="14" rx="1" />
                        <rect x="555" y="70" width="10" height="14" rx="1" />
                        <rect x="535" y="95" width="10" height="14" rx="1" className="tv-effect" style={{ animationDelay: '2.1s' }} />
                        <rect x="555" y="95" width="10" height="14" rx="1" />

                        {/* x:700, y:70 */}
                        <rect x="712" y="95" width="8" height="12" rx="1" />
                        <rect x="725" y="95" width="8" height="12" rx="1" />

                        {/* x:860, y:35 */}
                        <rect x="878" y="60" width="10" height="16" rx="1" />
                        <rect x="898" y="60" width="10" height="16" rx="1" />
                        <rect x="878" y="87" width="10" height="16" rx="1" />
                        <rect x="898" y="87" width="10" height="16" rx="1" className="tv-effect" style={{ animationDelay: '1.8s' }} />
                        <rect x="878" y="114" width="10" height="16" rx="1" />

                        {/* x:1040, y:70 */}
                        <rect x="1052" y="95" width="8" height="12" rx="1" />
                        <rect x="1065" y="95" width="8" height="12" rx="1" />

                        {/* x:1200, y:45 */}
                        <rect x="1218" y="70" width="10" height="14" rx="1" />
                        <rect x="1238" y="70" width="10" height="14" rx="1" />
                        <rect x="1218" y="95" width="10" height="14" rx="1" />
                        <rect x="1238" y="95" width="10" height="14" rx="1" className="tv-effect" style={{ animationDelay: '3.2s' }} />

                        {/* x:1380, y:80 */}
                        <rect x="1392" y="105" width="8" height="12" rx="1" />
                        <rect x="1405" y="105" width="8" height="12" rx="1" />
                    </g>
                    {/* Rooftop details removed */}
                    <g className="animate-entrance-bottom delay-300">
                        <path d="M0,500 L0,260 L45,260 L45,195 L95,195 L95,260 L140,260 L140,165 L185,165 L185,260 L220,260 L220,135 L295,135 L295,260 L330,260 L330,180 L400,180 L400,260 L440,260 L440,150 L510,150 L510,260 L550,260 L550,200 L610,200 L610,260 L650,260 L650,125 L720,125 L720,260 L760,260 L760,175 L820,175 L820,260 L860,260 L860,155 L920,155 L920,260 L960,260 L960,175 L1030,175 L1030,260 L1070,260 L1070,160 L1130,160 L1130,260 L1170,260 L1170,130 L1250,130 L1250,260 L1290,260 L1290,180 L1350,180 L1350,260 L1390,260 L1390,165 L1450,165 L1450,500 Z" fill="url(#skylineGradient2)" opacity="1" />
                    </g>
                    <g fill="rgba(255,200,100,0.06)" className="animate-entrance-bottom delay-300">
                        <rect x="250" y="155" width="14" height="22" rx="1" />
                        <rect x="250" y="185" width="14" height="22" rx="1" />
                        <rect x="268" y="155" width="14" height="22" rx="1" className="tv-effect" style={{ animationDelay: '3.5s' }} />
                        <rect x="470" y="165" width="12" height="20" rx="1" />
                        <rect x="470" y="195" width="12" height="20" rx="1" />
                        <rect x="485" y="165" width="12" height="20" rx="1" />
                        <rect x="680" y="145" width="12" height="18" rx="1" />
                        <rect x="680" y="170" width="12" height="18" rx="1" />
                        <rect x="695" y="145" width="12" height="18" rx="1" className="tv-effect" style={{ animationDelay: '1.2s' }} />
                        <rect x="885" y="165" width="12" height="20" rx="1" />
                        <rect x="885" y="195" width="12" height="20" rx="1" />
                        <rect x="1095" y="170" width="12" height="20" rx="1" />
                        <rect x="1095" y="200" width="12" height="20" rx="1" />
                        <rect x="1205" y="155" width="14" height="22" rx="1" />
                        <rect x="1205" y="185" width="14" height="22" rx="1" className="tv-effect" style={{ animationDelay: '4.1s' }} />
                    </g>
                    <g className="animate-entrance-bottom delay-600">
                        <path d="M0,500 L0,320 L25,320 L25,280 L35,270 L65,270 L75,280 L75,320 L120,320 L120,250 L130,240 L160,240 L170,250 L170,320 L210,320 L210,295 L260,295 L260,320 L290,320 L290,260 L300,250 L345,250 L355,260 L355,320 L390,320 L390,280 L450,280 L450,320 L485,320 L485,240 L495,230 L540,230 L550,240 L550,320 L585,320 L585,290 L645,290 L645,320 L680,320 L680,255 L690,245 L735,245 L745,255 L745,320 L780,320 L780,275 L840,275 L840,320 L875,320 L875,260 L885,250 L930,250 L940,260 L940,320 L975,320 L975,285 L1035,285 L1035,320 L1070,320 L1070,245 L1080,235 L1125,235 L1135,245 L1135,320 L1170,320 L1170,280 L1230,280 L1230,320 L1265,320 L1265,265 L1275,255 L1320,255 L1330,265 L1330,320 L1365,320 L1365,290 L1420,290 L1420,320 L1440,320 L1440,500 Z" fill="url(#skylineGradient3)" opacity="1" />
                    </g>
                    <g fill="rgba(255,200,100,0.12)" className="animate-entrance-bottom delay-600">
                        <rect x="50" y="278" width="10" height="14" rx="1" />
                        <rect x="138" y="255" width="12" height="18" rx="1" className="tv-effect" style={{ animationDelay: '0.2s' }} />
                        <rect x="138" y="280" width="12" height="14" rx="1" />
                        <rect x="318" y="265" width="12" height="18" rx="1" />
                        <rect x="318" y="290" width="12" height="14" rx="1" className="tv-effect" style={{ animationDelay: '0.5s' }} />
                        <rect x="512" y="245" width="12" height="18" rx="1" className="tv-effect" style={{ animationDelay: '1.5s' }} />
                        <rect x="512" y="270" width="12" height="14" rx="1" />
                        <rect x="525" y="245" width="12" height="18" rx="1" />
                        <rect x="705" y="260" width="12" height="16" rx="1" />
                        <rect x="718" y="260" width="12" height="16" rx="1" className="tv-effect" style={{ animationDelay: '2.8s' }} />
                        <rect x="902" y="265" width="12" height="18" rx="1" className="tv-effect" style={{ animationDelay: '5.0s' }} />
                        <rect x="902" y="290" width="12" height="14" rx="1" />
                        <rect x="1098" y="250" width="12" height="18" rx="1" className="tv-effect" style={{ animationDelay: '0.8s' }} />
                        <rect x="1098" y="275" width="12" height="14" rx="1" />
                        <rect x="1292" y="270" width="12" height="18" rx="1" />
                        <rect x="1292" y="295" width="12" height="14" rx="1" />
                    </g>
                    <g className="animate-entrance-bottom delay-900">
                        <path d="M0,500 L0,395 L30,395 L30,370 L60,370 L60,395 L100,395 L100,375 L140,375 L140,395 L175,395 L175,365 L205,365 L205,395 L250,395 L250,370 L285,370 L285,395 L325,395 L325,360 L355,360 L355,395 L400,395 L400,375 L435,375 L435,395 L475,395 L475,355 L505,355 L505,395 L550,395 L550,372 L585,372 L585,395 L625,395 L625,360 L655,360 L655,395 L700,395 L700,375 L735,375 L735,395 L775,395 L775,363 L805,363 L805,395 L850,395 L850,375 L885,375 L885,395 L925,395 L925,357 L955,357 L955,395 L1000,395 L1000,375 L1035,375 L1035,395 L1075,395 L1075,363 L1105,363 L1105,395 L1150,395 L1150,375 L1185,375 L1185,395 L1225,395 L1225,360 L1255,360 L1255,395 L1300,395 L1300,375 L1335,375 L1335,395 L1375,395 L1375,365 L1405,365 L1405,395 L1440,395 L1440,500 Z" fill="#0a1218" />
                    </g>
                    <g fill="#070d12" className="animate-entrance-bottom delay-1000">
                        <ellipse cx="82" cy="378" rx="20" ry="28" />
                        <rect x="79" y="395" width="6" height="65" />
                        <ellipse cx="225" cy="372" rx="18" ry="32" />
                        <rect x="222" y="395" width="6" height="65" />
                        <ellipse cx="375" cy="380" rx="24" ry="22" />
                        <rect x="372" y="392" width="6" height="68" />
                        <ellipse cx="525" cy="368" rx="16" ry="35" />
                        <rect x="522" y="395" width="6" height="65" />
                        <ellipse cx="675" cy="375" rx="22" ry="28" />
                        <rect x="672" y="395" width="6" height="65" />
                        <ellipse cx="825" cy="370" rx="18" ry="32" />
                        <rect x="822" y="395" width="6" height="65" />
                        <ellipse cx="975" cy="378" rx="24" ry="24" />
                        <rect x="972" y="393" width="6" height="67" />
                        <ellipse cx="1125" cy="368" rx="16" ry="35" />
                        <rect x="1122" y="395" width="6" height="65" />
                        <ellipse cx="1275" cy="375" rx="22" ry="28" />
                        <rect x="1272" y="395" width="6" height="65" />
                        <ellipse cx="1420" cy="382" rx="18" ry="20" />
                        <rect x="1417" y="395" width="6" height="65" />
                    </g>
                    <g fill="#080f15" className="animate-entrance-bottom delay-900">
                        <rect x="38" y="360" width="8" height="15" />
                        <rect x="183" y="355" width="8" height="15" />
                        <rect x="333" y="350" width="8" height="15" />
                        <rect x="483" y="345" width="8" height="15" />
                        <rect x="633" y="350" width="8" height="15" />
                        <rect x="783" y="353" width="8" height="15" />
                        <rect x="933" y="347" width="8" height="15" />
                        <rect x="1083" y="353" width="8" height="15" />
                        <rect x="1233" y="350" width="8" height="15" />
                        <rect x="1383" y="355" width="8" height="15" />
                    </g>
                    <g className="animate-entrance-bottom delay-1000">
                        {[
                            { cx: 45, yHead: 383, yPole: 387, pHeight: 73, delay: '0.3s' },
                            { cx: 151.5, yHead: 385, yPole: 389, pHeight: 71, delay: '0.0s', flickerClass: 'light-horror' },
                            { cx: 190, yHead: 378, yPole: 382, pHeight: 78, delay: '2.0s' },
                            { cx: 340, yHead: 373, yPole: 377, pHeight: 83, delay: '1.2s' },
                            { cx: 441.5, yHead: 385, yPole: 389, pHeight: 71, delay: '1.5s' },
                            { cx: 490, yHead: 368, yPole: 372, pHeight: 88, delay: '0.7s' },
                            { cx: 640, yHead: 373, yPole: 377, pHeight: 83, delay: '2.5s' },
                            { cx: 741.5, yHead: 385, yPole: 389, pHeight: 71, delay: '3.2s', flickerClass: 'light-horror' },
                            { cx: 790, yHead: 376, yPole: 380, pHeight: 80, delay: '1.5s' },
                            { cx: 940, yHead: 370, yPole: 374, pHeight: 86, delay: '0.5s' },
                            { cx: 1041.5, yHead: 385, yPole: 389, pHeight: 71, delay: '2.2s' },
                            { cx: 1090, yHead: 376, yPole: 380, pHeight: 80, delay: '4s', flickerClass: 'light-horror' },
                            { cx: 1240, yHead: 373, yPole: 377, pHeight: 83, delay: '1.8s' },
                            { cx: 1341.5, yHead: 385, yPole: 389, pHeight: 71, delay: '1.0s', flickerClass: 'light-horror' },
                            { cx: 1390, yHead: 378, yPole: 382, pHeight: 78, delay: '0.9s' }
                        ].map((light, i) => (
                            <g key={i}>
                                <rect x={light.cx - 1.5} y={light.yPole} width="3" height={light.pHeight} fill="#070d12" />
                                <path d={`M${light.cx - 8},${light.yHead + 4} C${light.cx - 8},${light.yHead - 2} ${light.cx + 8},${light.yHead - 2} ${light.cx + 8},${light.yHead + 4} Z`} fill="#070d12" />
                                <ellipse cx={light.cx} cy={light.yHead + 4} rx="5" ry="2" fill="#ffeaa7" filter="url(#starGlow)" className={light.flickerClass || 'light-flicker'} style={{ animationDelay: light.delay }} />
                                <ellipse cx={light.cx} cy={light.yHead + 4} rx="3" ry="1.2" fill="#ffffff" className={light.flickerClass || 'light-flicker'} style={{ animationDelay: light.delay }} />
                                <path d={`M${light.cx - 4},${light.yHead + 5} L${light.cx - 30},500 L${light.cx + 30},500 L${light.cx + 4},${light.yHead + 5} Z`} fill="url(#lightBeamGradient)" className={light.flickerClass || 'light-flicker'} style={{ animationDelay: light.delay, opacity: 0.8, mixBlendMode: 'normal' }} />
                            </g>
                        ))}
                    </g>
                    <rect x="0" y="420" width="1440" height="80" fill="url(#fogGradient)" />
                    <rect x="0" y="460" width="1440" height="40" fill="#050a0e" />
                </svg>
            </div>
        </div>
    );
});

HouseShadowBackground.displayName = 'HouseShadowBackground';

export default HouseShadowBackground;



