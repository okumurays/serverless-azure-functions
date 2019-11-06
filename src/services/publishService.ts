import { Site } from "@azure/arm-appservice/esm/models";
import Serverless from "serverless";
import { BaseService } from "./baseService";
import { FunctionAppService } from "./functionAppService";
import { SupportedRuntimeLanguage, FunctionAppOS } from "../models/serverless";
import { configConstants } from "../config";
import { AzureBlobStorageService } from "./azureBlobStorageService";

export class PublishService extends BaseService {
  private functionAppService: FunctionAppService;
  private blobService: AzureBlobStorageService;

  public constructor(serverless: Serverless, options: Serverless.Options, functionAppService: FunctionAppService) {
    super(serverless, options);
    this.functionAppService = functionAppService;
    this.blobService = new AzureBlobStorageService(serverless, options);
  }

  public async publish(functionApp: Site, functionZipFile: string) {
    switch (this.config.provider.os) {
      case FunctionAppOS.LINUX:
        await this.linuxPublish(functionApp);
        break;
      case FunctionAppOS.WINDOWS:
        await this.windowsPublish(functionApp, functionZipFile);
        break;
    }

    switch (this.config.provider.functionRuntime.language) {
      case SupportedRuntimeLanguage.NODE:

        break;
      case SupportedRuntimeLanguage.PYTHON:

        break;
    }

    this.log("Deployed serverless functions:")
    const serverlessFunctions = this.serverless.service.getAllFunctions();
    const deployedFunctions = await this.functionAppService.listFunctions(functionApp);

    // List functions that are part of the serverless yaml config
    deployedFunctions.forEach((functionConfig) => {
      if (serverlessFunctions.includes(functionConfig.name)) {
        const httpConfig = this.functionAppService.getFunctionHttpTriggerConfig(functionApp, functionConfig);

        if (httpConfig) {
          const method = httpConfig.methods[0].toUpperCase();
          this.log(`-> ${functionConfig.name}: [${method}] ${httpConfig.url}`);
        }
      }
    });
  }

  private async linuxPublish(functionApp: Site) {
    this.log("Updating function app setting to run from external package...");
    await this.blobService.initialize();

    const sasUrl = await this.blobService.generateBlobSasTokenUrl(
      this.config.provider.deployment.container,
      this.artifactName
    );
    const response = await this.functionAppService.updateFunctionAppSetting(
      functionApp,
      configConstants.runFromPackageSetting,
      sasUrl
    );
    await this.functionAppService.syncTriggers(functionApp, response.properties);
  }

  private async windowsPublish(functionApp: Site, functionZipFile: string) {
    this.log("Deploying serverless functions...");
    await this.functionAppService.uploadZippedArtifactToFunctionApp(functionApp, functionZipFile);
  }
}
