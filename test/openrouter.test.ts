import {
  DEFAULT_MODELS,
  ServiceProvider,
  ModelProvider,
  ApiPath,
  OPENROUTER_BASE_URL,
  OpenRouter,
} from "../app/constant";

describe("OpenRouter constants", () => {
  test("OPENROUTER_BASE_URL should be set", () => {
    expect(OPENROUTER_BASE_URL).toBe("https://openrouter.ai/api");
  });

  test("ServiceProvider should include OpenRouter", () => {
    expect(ServiceProvider.OpenRouter).toBe("OpenRouter");
  });

  test("ModelProvider should include OpenRouter", () => {
    expect(ModelProvider.OpenRouter).toBe("OpenRouter");
  });

  test("ApiPath should include OpenRouter", () => {
    expect(ApiPath.OpenRouter).toBe("/api/openrouter");
  });

  test("OpenRouter ChatPath should be correct", () => {
    expect(OpenRouter.ChatPath).toBe("v1/chat/completions");
  });

  test("OpenRouter ExampleEndpoint should match BASE_URL", () => {
    expect(OpenRouter.ExampleEndpoint).toBe(OPENROUTER_BASE_URL);
  });
});

describe("OpenRouter models in DEFAULT_MODELS", () => {
  const openrouterModels = DEFAULT_MODELS.filter(
    (m) => m.provider.id === "openrouter",
  );

  test("should have OpenRouter models", () => {
    expect(openrouterModels.length).toBeGreaterThan(0);
  });

  test("each OpenRouter model should have correct provider info", () => {
    for (const model of openrouterModels) {
      expect(model.provider.providerName).toBe("OpenRouter");
      expect(model.provider.providerType).toBe("openrouter");
      expect(model.available).toBe(true);
    }
  });

  test("should include openrouter/auto model", () => {
    const autoModel = openrouterModels.find((m) => m.name === "openrouter/auto");
    expect(autoModel).toBeDefined();
  });

  test("should include third-party models routed through OpenRouter", () => {
    const modelNames = openrouterModels.map((m) => m.name);
    expect(modelNames).toContain("xiaomi/mimo-v2-pro");
    expect(modelNames).toContain("qwen/qwen3.6-plus");
    expect(modelNames).toContain("minimax/minimax-m2.7");
    expect(modelNames).toContain("z-ai/glm-5.1");
  });

  test("OpenRouter models should have sorted order 16 (last built-in provider)", () => {
    for (const model of openrouterModels) {
      expect(model.provider.sorted).toBe(16);
    }
  });
});

describe("OpenRouter model provider utilities", () => {
  test("getModelProvider with openrouter provider", async () => {
    const { getModelProvider } = await import("../app/utils/model");
    const [model, provider] = getModelProvider(
      "openrouter/auto@OpenRouter",
    );
    expect(model).toBe("openrouter/auto");
    expect(provider).toBe("OpenRouter");
  });

  test("collectModelsWithDefaultModel should include OpenRouter models", async () => {
    const { collectModelsWithDefaultModel } = await import("../app/utils/model");
    const models = collectModelsWithDefaultModel(
      DEFAULT_MODELS as any,
      "",
      "",
    );
    const openRouterModels = models.filter(
      (m) => m?.provider?.id === "openrouter",
    );
    expect(openRouterModels.length).toBeGreaterThan(0);
  });
});
