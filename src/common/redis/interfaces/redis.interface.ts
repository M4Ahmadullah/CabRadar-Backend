export interface RedisService {
  geoAdd(
    key: string,
    member: string,
    longitude: number,
    latitude: number,
  ): Promise<number>;
  geoRadius(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: 'm' | 'km' | 'mi' | 'ft',
  ): Promise<string[]>;
  geoRadiusWithDistance(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: 'm' | 'km' | 'mi' | 'ft',
  ): Promise<Array<[string, number]>>;
  geoDist(key: string, member1: string, member2: string): Promise<number>;
  getJson<T>(key: string): Promise<T | null>;
  setJson(key: string, value: any, ttl?: number): Promise<void>;
  geoSearch(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: 'm' | 'km' | 'mi' | 'ft',
    options?: {
      withCoord?: boolean;
      withHash?: boolean;
      withDist?: boolean;
      count?: number;
      sort?: 'ASC' | 'DESC';
    },
  ): Promise<
    Array<{
      name: string;
      coordinates?: [number, number];
      hash?: string;
      distance?: number;
    }>
  >;
}
