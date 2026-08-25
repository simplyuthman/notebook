// AI Adapter interface
export interface AiService {
  transcribe(image: any): Promise<any>;
  structure(sections: any[]): Promise<any>;
}
