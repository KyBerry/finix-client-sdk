import { Finix } from ".";
import { Environment } from ".";

const form = new Finix("", Environment.Type.SANDBOX);

form.CardTokenForm("#example");
