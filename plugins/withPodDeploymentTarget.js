// Newer Xcode rejects pods that target anything below iOS 15. Raise every pod
// target to the app's deployment target in the Podfile's post_install hook.
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARK = "# closer: pod deployment target";

module.exports = function withPodDeploymentTarget(config, { target = "16.0" } = {}) {
  return withDangerousMod(config, ["ios", (cfg) => {
    const file = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
    let podfile = fs.readFileSync(file, "utf8");
    if (!podfile.includes(MARK)) {
      podfile = podfile.replace(/post_install do \|installer\|\n/, `post_install do |installer|
    ${MARK}
    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |bc|
        current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${target}' if current.nil? || current.to_f < ${parseFloat(target)}
      end
    end
`);
      fs.writeFileSync(file, podfile);
    }
    return cfg;
  }]);
};
