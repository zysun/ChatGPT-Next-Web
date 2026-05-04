import {
  DEFAULT_MODELS,
  ServiceProvider,
  ModelProvider,
  ApiPath,
  MIMO_BASE_URL,
  MiMo,
} from "../app/constant";

describe("MiMo constants", () => {
  test("MIMO_BASE_URL should be set", () => {
    expect(MIMO_BASE_URL).toBe("https://api.xiaomimimo.com");
  });

  test("ServiceProvider should include MiMo", () => {
    expect(ServiceProvider.MiMo).toBe("MiMo");
  });

  test("ModelProvider should include MiMo", () => {
    expect(ModelProvider.MiMo).toBe("MiMo");
  });

  test("ApiPath should include MiMo", () => {
    expect(ApiPath.MiMo).toBe("/api/mimo");
  });

  test("MiMo ChatPath should be correct", () => {
    expect(MiMo.ChatPath).toBe("v1/chat/completions");
  });

  test("MiMo ExampleEndpoint should match MIMO_BASE_URL", () => {
    expect(MiMo.ExampleEndpoint).toBe(MIMO_BASE_URL);
  });
});

describe("MiMo models in DEFAULT_MODELS", () => {
  const mimoModels = DEFAULT_MODELS.filter(
    (m) => m.provider.id === "mimo",
  );

  test("should have MiMo models", () => {
    expect(mimoModels.length).toBeGreaterThan(0);
  });

  test("each MiMo model should have correct provider info", () => {
    for (const model of mimoModels) {
      expect(model.provider.providerName).toBe("MiMo");
      expect(model.provider.providerType).toBe("mimo");
      expect(model.available).toBe(true);
    }
  });

  test("should include mimo-v2.5-pro model", () => {
    const proModel = mimoModels.find((m) => m.name === "mimo-v2.5-pro");
    expect(proModel).toBeDefined();
  });

  test("should include expected MiMo models", () => {
    const modelNames = mimoModels.map((m) => m.name);
    expect(modelNames).toContain("mimo-v2.5-pro");
    expect(modelNames).toContain("mimo-v2.5-flash");
    expect(modelNames).toContain("mimo-v2-pro");
    expect(modelNames).toContain("mimo-v2-flash");
    expect(modelNames).toContain("mimo-v2-omni");
  });

  test("MiMo models should have sorted order 17", () => {
    for (const model of mimoModels) {
      expect(model.provider.sorted).toBe(17);
    }
  });
});

describe("MiMo model provider utilities", () => {
  test("getModelProvider with mimo provider", async () => {
    const { getModelProvider } = await import("../app/utils/model");
    const [model, provider] = getModelProvider(
      "mimo-v2.5-pro@MiMo",
    );
    expect(model).toBe("mimo-v2.5-pro");
    expect(provider).toBe("MiMo");
  });

  test("collectModelsWithDefaultModel should include MiMo models", async () => {
    const { collectModelsWithDefaultModel } = await import("../app/utils/model");
    const models = collectModelsWithDefaultModel(
      DEFAULT_MODELS as any,
      "",
      "",
    );
    const mimoModels = models.filter(
      (m) => m?.provider?.id === "mimo",
    );
    expect(mimoModels.length).toBeGreaterThan(0);
  });
});
