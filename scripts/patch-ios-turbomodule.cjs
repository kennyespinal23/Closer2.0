// Backport the async exception fix from react/react-native#56265 to RN 0.81.
// Keep sync conversion intact: only async calls run outside the JS thread.
const fs = require("node:fs");
const path = require("node:path");

function patch(source) {
  const start = source.indexOf("void ObjCTurboModule::performVoidMethodInvocation(");
  if (start < 0) throw new Error("TurboModule void invocation was not found; review the native patch.");
  const before = source.slice(0, start);
  const body = source.slice(start);
  const marker = "// Closer: never access Hermes from the native async queue.";
  if (body.includes(marker)) return source;
  const old = "      throw convertNSExceptionToJSError(runtime, exception, std::string{moduleName}, methodNameStr);";
  const index = body.indexOf(old);
  if (index < 0) throw new Error("TurboModule exception handler changed; review the native patch.");
  const replacement = `      ${marker}
      if (shouldVoidMethodsExecuteSync_) {
        throw convertNSExceptionToJSError(runtime, exception, std::string{moduleName}, methodNameStr);
      } else {
        @throw exception;
      }`;
  return before + body.slice(0, index) + replacement + body.slice(index + old.length);
}

if (require.main === module) {
  const root = path.dirname(require.resolve("react-native/package.json"));
  const file = path.join(root, "ReactCommon/react/nativemodule/core/platform/ios/ReactCommon/RCTTurboModule.mm");
  const original = fs.readFileSync(file, "utf8");
  const updated = patch(original);
  if (updated !== original) fs.writeFileSync(file, updated);
  console.log("Verified iOS TurboModule async exception patch.");
}

module.exports = { patch };
