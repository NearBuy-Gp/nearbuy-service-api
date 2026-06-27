export interface CreateEmbeddingResponse {
  item_id: string;
  embedding_text: string;
  embedding_vector: number[];
  dimensions: number;
}
