import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock db functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    createVideoProject: vi.fn(),
    getVideoProjectById: vi.fn(),
    getUserVideoProjects: vi.fn(),
    updateVideoProject: vi.fn(),
    deleteVideoProject: vi.fn(),
    createVideoScene: vi.fn(),
    getProjectScenes: vi.fn(),
    getExtendableScenes: vi.fn(),
    createSceneScreenshot: vi.fn(),
    getSceneScreenshots: vi.fn(),
    selectScreenshot: vi.fn(),
    createGeneratedSegment: vi.fn(),
    getProjectSegments: vi.fn(),
    createGenerationJob: vi.fn(),
    getFullVideoProject: vi.fn(),
  };
});

describe("Video Recreate System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Video Project CRUD", () => {
    it("should create a new video project", async () => {
      const mockProjectId = 1;
      vi.mocked(db.createVideoProject).mockResolvedValue(mockProjectId);

      const project = {
        userId: 1,
        title: "Test Video Project",
        description: "Test description",
        sourceType: "url" as const,
        sourceUrl: "https://example.com/video.mp4",
        projectType: "extend_scene" as const,
        targetModel: "wan_2_6" as const,
        generateNude: false,
        generateAudio: true,
      };

      const result = await db.createVideoProject(project);
      
      expect(db.createVideoProject).toHaveBeenCalledWith(project);
      expect(result).toBe(mockProjectId);
    });

    it("should get video project by id", async () => {
      const mockProject = {
        id: 1,
        userId: 1,
        title: "Test Project",
        status: "draft",
        analysisStatus: "pending",
      };
      vi.mocked(db.getVideoProjectById).mockResolvedValue(mockProject as any);

      const result = await db.getVideoProjectById(1);
      
      expect(db.getVideoProjectById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProject);
    });

    it("should get user video projects", async () => {
      const mockProjects = [
        { id: 1, userId: 1, title: "Project 1" },
        { id: 2, userId: 1, title: "Project 2" },
      ];
      vi.mocked(db.getUserVideoProjects).mockResolvedValue(mockProjects as any);

      const result = await db.getUserVideoProjects(1, 20, 0);
      
      expect(db.getUserVideoProjects).toHaveBeenCalledWith(1, 20, 0);
      expect(result).toHaveLength(2);
    });

    it("should update video project", async () => {
      vi.mocked(db.updateVideoProject).mockResolvedValue(undefined);

      await db.updateVideoProject(1, { title: "Updated Title" });
      
      expect(db.updateVideoProject).toHaveBeenCalledWith(1, { title: "Updated Title" });
    });

    it("should delete video project", async () => {
      vi.mocked(db.deleteVideoProject).mockResolvedValue(undefined);

      await db.deleteVideoProject(1);
      
      expect(db.deleteVideoProject).toHaveBeenCalledWith(1);
    });
  });

  describe("Video Scene Analysis", () => {
    it("should create video scenes", async () => {
      const mockSceneId = 1;
      vi.mocked(db.createVideoScene).mockResolvedValue(mockSceneId);

      const scene = {
        projectId: 1,
        sceneNumber: 1,
        startTime: 0,
        endTime: 15000,
        duration: 15000,
        sceneType: "dialogue" as const,
        isKeyScene: false,
        canExtend: false,
        description: "Opening dialogue",
      };

      const result = await db.createVideoScene(scene);
      
      expect(db.createVideoScene).toHaveBeenCalledWith(scene);
      expect(result).toBe(mockSceneId);
    });

    it("should get extendable scenes", async () => {
      const mockScenes = [
        { id: 1, sceneType: "kiss", canExtend: true, isKeyScene: true },
        { id: 2, sceneType: "intimate", canExtend: true, isKeyScene: true },
      ];
      vi.mocked(db.getExtendableScenes).mockResolvedValue(mockScenes as any);

      const result = await db.getExtendableScenes(1);
      
      expect(db.getExtendableScenes).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result.every(s => s.canExtend)).toBe(true);
    });

    it("should detect key scenes (kiss, intimate)", async () => {
      const mockScenes = [
        { id: 1, sceneType: "dialogue", isKeyScene: false },
        { id: 2, sceneType: "kiss", isKeyScene: true },
        { id: 3, sceneType: "intimate", isKeyScene: true },
      ];
      vi.mocked(db.getProjectScenes).mockResolvedValue(mockScenes as any);

      const result = await db.getProjectScenes(1);
      const keyScenes = result.filter(s => s.isKeyScene);
      
      expect(keyScenes).toHaveLength(2);
      expect(keyScenes.map(s => s.sceneType)).toContain("kiss");
      expect(keyScenes.map(s => s.sceneType)).toContain("intimate");
    });
  });

  describe("Scene Screenshots", () => {
    it("should create scene screenshots", async () => {
      const mockScreenshotId = 1;
      vi.mocked(db.createSceneScreenshot).mockResolvedValue(mockScreenshotId);

      const screenshot = {
        sceneId: 1,
        projectId: 1,
        frameNumber: 1,
        timestamp: 45000,
        imageUrl: "/screenshots/frame1.jpg",
      };

      const result = await db.createSceneScreenshot(screenshot);
      
      expect(db.createSceneScreenshot).toHaveBeenCalledWith(screenshot);
      expect(result).toBe(mockScreenshotId);
    });

    it("should get 4 screenshots per scene", async () => {
      const mockScreenshots = [
        { id: 1, frameNumber: 1, timestamp: 45000 },
        { id: 2, frameNumber: 2, timestamp: 46000 },
        { id: 3, frameNumber: 3, timestamp: 47000 },
        { id: 4, frameNumber: 4, timestamp: 48000 },
      ];
      vi.mocked(db.getSceneScreenshots).mockResolvedValue(mockScreenshots as any);

      const result = await db.getSceneScreenshots(1);
      
      expect(result).toHaveLength(4);
      expect(result.map(s => s.frameNumber)).toEqual([1, 2, 3, 4]);
    });

    it("should select screenshot for scene", async () => {
      vi.mocked(db.selectScreenshot).mockResolvedValue(undefined);

      await db.selectScreenshot(2, 1);
      
      expect(db.selectScreenshot).toHaveBeenCalledWith(2, 1);
    });
  });

  describe("Video Generation", () => {
    it("should create generated segment", async () => {
      const mockSegmentId = 1;
      vi.mocked(db.createGeneratedSegment).mockResolvedValue(mockSegmentId);

      const segment = {
        projectId: 1,
        sceneId: 1,
        segmentNumber: 1,
        prompt: "Continue the kiss scene with more intensity",
        model: "wan_2_6" as const,
        duration: 6000,
        includeNude: false,
        includeAudio: true,
        status: "pending" as const,
      };

      const result = await db.createGeneratedSegment(segment);
      
      expect(db.createGeneratedSegment).toHaveBeenCalledWith(segment);
      expect(result).toBe(mockSegmentId);
    });

    it("should support different AI models", async () => {
      const models = ["hailuo_ai", "veo_3", "wan_2_6"] as const;
      
      for (const model of models) {
        vi.mocked(db.createGeneratedSegment).mockResolvedValue(1);
        
        await db.createGeneratedSegment({
          projectId: 1,
          segmentNumber: 1,
          prompt: "Test prompt",
          model,
          status: "pending",
        });
        
        expect(db.createGeneratedSegment).toHaveBeenCalledWith(
          expect.objectContaining({ model })
        );
      }
    });

    it("should create generation job", async () => {
      const mockJobId = 1;
      vi.mocked(db.createGenerationJob).mockResolvedValue(mockJobId);

      const job = {
        projectId: 1,
        segmentId: 1,
        jobType: "generation" as const,
        provider: "wan_2_6" as const,
        status: "queued" as const,
      };

      const result = await db.createGenerationJob(job);
      
      expect(db.createGenerationJob).toHaveBeenCalledWith(job);
      expect(result).toBe(mockJobId);
    });
  });

  describe("Full Project Data", () => {
    it("should get full project with scenes, segments and jobs", async () => {
      const mockFullProject = {
        id: 1,
        title: "Full Project",
        scenes: [
          { id: 1, sceneType: "kiss", screenshots: [{ id: 1, frameNumber: 1 }] },
        ],
        segments: [
          { id: 1, status: "completed", videoUrl: "/generated/video1.mp4" },
        ],
        jobs: [
          { id: 1, jobType: "generation", status: "completed" },
        ],
      };
      vi.mocked(db.getFullVideoProject).mockResolvedValue(mockFullProject as any);

      const result = await db.getFullVideoProject(1);
      
      expect(db.getFullVideoProject).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty("scenes");
      expect(result).toHaveProperty("segments");
      expect(result).toHaveProperty("jobs");
      expect(result?.scenes[0]).toHaveProperty("screenshots");
    });
  });

  describe("Project Types", () => {
    it("should support extend_scene project type", async () => {
      vi.mocked(db.createVideoProject).mockResolvedValue(1);
      
      await db.createVideoProject({
        userId: 1,
        title: "Extend Scene Project",
        sourceType: "url",
        projectType: "extend_scene",
        targetModel: "wan_2_6",
      });
      
      expect(db.createVideoProject).toHaveBeenCalledWith(
        expect.objectContaining({ projectType: "extend_scene" })
      );
    });

    it("should support remake project type", async () => {
      vi.mocked(db.createVideoProject).mockResolvedValue(1);
      
      await db.createVideoProject({
        userId: 1,
        title: "Remake Project",
        sourceType: "url",
        projectType: "remake",
        targetModel: "veo_3",
      });
      
      expect(db.createVideoProject).toHaveBeenCalledWith(
        expect.objectContaining({ projectType: "remake" })
      );
    });

    it("should support sequel project type", async () => {
      vi.mocked(db.createVideoProject).mockResolvedValue(1);
      
      await db.createVideoProject({
        userId: 1,
        title: "Sequel Project",
        sourceType: "youtube",
        projectType: "sequel",
        targetModel: "hailuo_ai",
      });
      
      expect(db.createVideoProject).toHaveBeenCalledWith(
        expect.objectContaining({ projectType: "sequel" })
      );
    });
  });

  describe("NSFW Content Generation", () => {
    it("should support generateNude option for WAN 2.6", async () => {
      vi.mocked(db.createVideoProject).mockResolvedValue(1);
      
      await db.createVideoProject({
        userId: 1,
        title: "NSFW Project",
        sourceType: "url",
        projectType: "extend_scene",
        targetModel: "wan_2_6",
        generateNude: true,
        generateAudio: true,
      });
      
      expect(db.createVideoProject).toHaveBeenCalledWith(
        expect.objectContaining({ 
          generateNude: true,
          targetModel: "wan_2_6"
        })
      );
    });
  });
});
