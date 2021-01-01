/**
 * Interface describes city data
 */
export interface ICity {
    boundingbox: string[];
    category: string;
    display_name: string
    geojson: {
        type: string,
        coordinates: [number, number][][]
    };
    icon: string;
    importance: number;
    lat: string;
    licence: string;
    lon: string;
    osm_id: number;
    osm_type: string;
    place_id: number;
    place_rank: number;
    type: string;
}
