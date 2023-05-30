import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Define the API base URL and bin ID
const API_BASE_URL = 'https://api.jsonbin.io/v3/b';

export class JsonBinApi {
  apiClient: AxiosInstance;
  binId: string;

  constructor(key: string, binId: string) {
    // Create an Axios instance with the base URL and headers
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': key,
        versioning: 'false',
      },
    });

    this.binId = binId;
  }

  // Function to handle Axios responses and return data or throw an error
  handleResponse = <T>(response: AxiosResponse<T>): T => {
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`Request failed with status code ${response.status}`);
    }
  };

  // Function to update data in the JSON bin
  updateData = async (data: any): Promise<void> => {
    try {
      const response = await this.apiClient.put(`/${this.binId}`, data);
      this.handleResponse(response);
    } catch (error: any) {
      throw new Error(`Failed to update data: ${error.message}`);
    }
  };

  // Function to read data from the JSON bin
  readData = async (): Promise<any> => {
    try {
      const response = await this.apiClient.get(`/${this.binId}`);
      return this.handleResponse(response);
    } catch (error: any) {
      throw new Error(`Failed to read data: ${error.message}`);
    }
  };
}
