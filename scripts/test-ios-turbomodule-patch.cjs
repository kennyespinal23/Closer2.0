const assert = require("node:assert/strict");
const { patch } = require("./patch-ios-turbomodule.cjs");

const conversion = "      throw convertNSExceptionToJSError(runtime, exception, std::string{moduleName}, methodNameStr);";
const prefix = `void otherMethod() {\n${conversion}\n}\n`;
const fixture = `${prefix}void ObjCTurboModule::performVoidMethodInvocation(\n${conversion}\n`;
const result = patch(fixture);
assert.ok(result.startsWith(prefix), "Other invocation handlers must remain unchanged");
assert.match(result.slice(prefix.length), /if \(shouldVoidMethodsExecuteSync_\)/);
assert.match(result.slice(prefix.length), /else \{\s+@throw exception;/);
assert.equal(patch(result), result, "Repeated installs must be safe");
assert.throws(() => patch("unrecognized source"), /not found/);
assert.throws(() => patch("void ObjCTurboModule::performVoidMethodInvocation("), /changed/);
console.log("iOS TurboModule patch checks passed.");
