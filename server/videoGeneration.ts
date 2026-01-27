/**
 * Video Generation Service
 * Integrates with MiniMax API for text-to-video and image-to-video generation
 * Supports models: T2V-01, I2V-01, MiniMax-Hailuo-02
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { storagePut } from './storage';
import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';

const execAsync = promisify(exec);

export type VideoModel = 
  | 'T2V-01'           // Text to video
  | 'T2V-01-Director'  // Text to video with camera control
  | 'I2V-01'           // Image to video
  | 'I2V-01-Director'  // Image to video with camera control
  | 'I2V-01-live'      // Image to video live
  | 'MiniMax-Hailuo-02'; // Latest model with best quality

export interface VideoGenerationParams {
  prompt: string;
  model?: VideoModel;
  firstFrameImage?: string; // URL or path for I2V models
  duration?: 6 | 10; // Only for MiniMax-Hailuo-02
  resolution?: '768P' | '1080P'; // Only for MiniMax-Hailuo-02
  asyncMode?: boolean;
}

export interface VideoGenerationResult {
  success: boolean;
  taskId?: string;
  videoUrl?: string;
  localPath?: string;
  error?: string;
}

export interface VideoQueryResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  localPath?: string;
  error?: string;
}

/**
 * Generate video using MiniMax API via MCP
 */
export async function generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
  const {
    prompt,
    model = 'MiniMax-Hailuo-02',
    firstFrameImage,
    duration = 6,
    resolution = '1080P',
    asyncMode = true,
  } = params;

  const outputDir = '/home/ubuntu/femsider/generated-videos';
  
  // Ensure output directory exists
  await execAsync(`mkdir -p ${outputDir}`);

  try {
    // Build MCP command
    const mcpInput: Record<string, any> = {
      prompt,
      model,
      output_directory: outputDir,
      async_mode: asyncMode,
    };

    // Add model-specific parameters
    if (model === 'MiniMax-Hailuo-02') {
      mcpInput.duration = duration;
      mcpInput.resolution = resolution;
    }

    // Add first frame for I2V models
    if (firstFrameImage && model.startsWith('I2V')) {
      mcpInput.first_frame_image = firstFrameImage;
    }

    const inputJson = JSON.stringify(mcpInput);
    const command = `manus-mcp-cli tool call generate_video --server minimax --input '${inputJson}'`;
    
    const { stdout, stderr } = await execAsync(command, { timeout: 300000 }); // 5 min timeout

    // Parse response
    if (asyncMode) {
      // Extract task_id from response
      const taskIdMatch = stdout.match(/task_id[:\s]+([a-zA-Z0-9_-]+)/i);
      if (taskIdMatch) {
        return {
          success: true,
          taskId: taskIdMatch[1],
        };
      }
    } else {
      // Extract video path from response
      const pathMatch = stdout.match(/(?:path|file)[:\s]+([^\s\n]+\.mp4)/i);
      if (pathMatch) {
        const localPath = pathMatch[1];
        // Upload to S3
        const fileBuffer = await fs.promises.readFile(localPath);
        const fileKey = `generated-videos/${nanoid()}.mp4`;
        const { url } = await storagePut(fileKey, fileBuffer, 'video/mp4');
        
        return {
          success: true,
          videoUrl: url,
          localPath,
        };
      }
    }

    // If we couldn't parse, return the raw output
    return {
      success: false,
      error: `Could not parse response: ${stdout}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Video generation failed',
    };
  }
}

/**
 * Query video generation task status
 */
export async function queryVideoGeneration(taskId: string): Promise<VideoQueryResult> {
  const outputDir = '/home/ubuntu/femsider/generated-videos';

  try {
    const inputJson = JSON.stringify({
      task_id: taskId,
      output_directory: outputDir,
    });
    
    const command = `manus-mcp-cli tool call query_video_generation --server minimax --input '${inputJson}'`;
    const { stdout } = await execAsync(command, { timeout: 60000 });

    // Check for completion
    if (stdout.includes('completed') || stdout.includes('success')) {
      const pathMatch = stdout.match(/(?:path|file)[:\s]+([^\s\n]+\.mp4)/i);
      if (pathMatch) {
        const localPath = pathMatch[1];
        // Upload to S3
        const fileBuffer = await fs.promises.readFile(localPath);
        const fileKey = `generated-videos/${nanoid()}.mp4`;
        const { url } = await storagePut(fileKey, fileBuffer, 'video/mp4');
        
        return {
          status: 'completed',
          videoUrl: url,
          localPath,
        };
      }
    }

    if (stdout.includes('processing') || stdout.includes('pending')) {
      return { status: 'processing' };
    }

    if (stdout.includes('failed') || stdout.includes('error')) {
      return {
        status: 'failed',
        error: 'Video generation failed',
      };
    }

    return { status: 'pending' };
  } catch (error: any) {
    return {
      status: 'failed',
      error: error.message,
    };
  }
}

/**
 * Generate image using MiniMax API (for thumbnails/screenshots)
 */
export async function generateImage(prompt: string, aspectRatio: string = '16:9'): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const outputDir = '/home/ubuntu/femsider/generated-images';
  await execAsync(`mkdir -p ${outputDir}`);

  try {
    const inputJson = JSON.stringify({
      prompt,
      aspect_ratio: aspectRatio,
      output_directory: outputDir,
      prompt_optimizer: true,
    });
    
    const command = `manus-mcp-cli tool call text_to_image --server minimax --input '${inputJson}'`;
    const { stdout } = await execAsync(command, { timeout: 120000 });

    const pathMatch = stdout.match(/(?:path|file)[:\s]+([^\s\n]+\.(png|jpg|jpeg))/i);
    if (pathMatch) {
      const localPath = pathMatch[1];
      const fileBuffer = await fs.promises.readFile(localPath);
      const ext = path.extname(localPath);
      const fileKey = `generated-images/${nanoid()}${ext}`;
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      const { url } = await storagePut(fileKey, fileBuffer, mimeType);
      
      return { success: true, imageUrl: url };
    }

    return { success: false, error: 'Could not parse image path' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Map internal model names to MiniMax models
 */
export function mapModelName(internalModel: string): VideoModel {
  switch (internalModel) {
    case 'wan_2_6':
      return 'MiniMax-Hailuo-02'; // Best quality, supports longer videos
    case 'hailuo_ai':
      return 'T2V-01-Director'; // With camera control
    case 'veo_3':
      return 'T2V-01'; // Standard text to video
    default:
      return 'MiniMax-Hailuo-02';
  }
}

/**
 * Camera movement instructions for Director models
 */
export const CAMERA_INSTRUCTIONS = {
  truckLeft: '[Truck left]',
  truckRight: '[Truck right]',
  panLeft: '[Pan left]',
  panRight: '[Pan right]',
  pushIn: '[Push in]',
  pullOut: '[Pull out]',
  pedestalUp: '[Pedestal up]',
  pedestalDown: '[Pedestal down]',
  tiltUp: '[Tilt up]',
  tiltDown: '[Tilt down]',
  zoomIn: '[Zoom in]',
  zoomOut: '[Zoom out]',
  shake: '[Shake]',
  tracking: '[Tracking shot]',
  static: '[Static shot]',
};
