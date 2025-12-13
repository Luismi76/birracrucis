"use client";

import { useMemo } from "react";
import { OverlayView } from "@react-google-maps/api";
import { Participant } from "./types";
import { distanceInMeters } from "@/lib/geo-utils";

const CLUSTER_RADIUS_METERS = 10;
const PARTICIPANT_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

type ParticipantMarkersProps = {
    participants: Participant[];
    map: google.maps.Map | null;
    onParticipantClick?: (participant: Participant) => void;
};

export function ParticipantMarkers({ participants, map, onParticipantClick }: ParticipantMarkersProps) {
    // Agrupamiento simple (Clustering)
    const clusters = useMemo(() => {
        const activeParticipants = participants.filter(p => p.lat !== 0 && p.lng !== 0 && p.lastSeenAt);
        const grouped: { lat: number, lng: number, members: Participant[] }[] = [];

        activeParticipants.forEach(p => {
            let added = false;
            for (const group of grouped) {
                if (distanceInMeters(p.lat, p.lng, group.lat, group.lng) <= CLUSTER_RADIUS_METERS) {
                    group.members.push(p);
                    // Recalcular centro del grupo
                    group.lat = group.members.reduce((sum, m) => sum + m.lat, 0) / group.members.length;
                    group.lng = group.members.reduce((sum, m) => sum + m.lng, 0) / group.members.length;
                    added = true;
                    break;
                }
            }
            if (!added) {
                grouped.push({ lat: p.lat, lng: p.lng, members: [p] });
            }
        });

        return grouped;
    }, [participants]);

    return (
        <>
            {clusters.map((cluster, i) => {
                const isGroup = cluster.members.length > 1;
                const firstMember = cluster.members[0];

                return (
                    <OverlayView
                        key={isGroup ? `cluster-${i}` : `participant-${firstMember.id}`}
                        position={{ lat: cluster.lat, lng: cluster.lng }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        getPixelPositionOffset={(width, height) => ({
                            x: -(width / 2),
                            y: -(height / 2),
                        })}
                    >
                        <div
                            className={`relative flex items-center justify-center rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95 ${isGroup ? "w-11 h-11 bg-amber-500 text-white" : "w-11 h-11 bg-white"
                                }`}
                            style={{
                                border: isGroup ? "3px solid white" : `3px solid ${PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length]}`,
                                zIndex: isGroup ? 200 : 100 + i
                            }}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent map click
                                if (isGroup) {
                                    map?.panTo({ lat: cluster.lat, lng: cluster.lng });
                                    map?.setZoom((map.getZoom() || 14) + 2);
                                } else if (onParticipantClick) {
                                    onParticipantClick(firstMember);
                                }
                            }}
                        >
                            {isGroup ? (
                                <span className="font-bold text-sm">+{cluster.members.length}</span>
                            ) : (
                                <>
                                    {firstMember.image ? (
                                        <img
                                            src={firstMember.image}
                                            alt={firstMember.name || "User"}
                                            className="w-full h-full rounded-full object-cover p-[2px]"
                                        />
                                    ) : (
                                        <span
                                            className="font-bold text-lg"
                                            style={{ color: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length] }}
                                        >
                                            {firstMember.name ? firstMember.name.charAt(0).toUpperCase() : "?"}
                                        </span>
                                    )}
                                </>
                            )}

                            {/* Etiqueta de nombre al hacer hover (opcional, simplificado) */}
                            {!isGroup && (
                                <div className="absolute -bottom-6 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                    {firstMember.name}
                                </div>
                            )}
                        </div>
                    </OverlayView>
                );
            })}
        </>
    );
}
