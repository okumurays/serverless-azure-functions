import { Guard } from "../shared/guard";
import Serverless from "serverless";
import { Utils } from "../shared/utils";
import { ServerlessCommandMap, ServerlessHookMap, ServerlessAzureConfig } from "../models/serverless";

export abstract class AzureBasePlugin<TOptions=Serverless.Options> {

  public hooks: ServerlessHookMap
  protected config: ServerlessAzureConfig;
  protected commands: ServerlessCommandMap;

  public constructor(
    protected serverless: Serverless,
    protected options: TOptions,
  ) {
    Guard.null(serverless);
    this.config = serverless.service as any;
  }

  protected log(message: string) {
    this.serverless.cli.log(message);
  }

  protected getOption(key: string, defaultValue?: any): string {
    return Utils.get(this.options, key, defaultValue);
  }
}
