import { IGeometry } from "./geometry.interface";

/**
 * Interface describes GeoJSON geometry
 */
export interface IGeoJSON {
    type: string;
    geometries: IGeometry[];
}
