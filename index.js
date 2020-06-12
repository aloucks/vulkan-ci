const core = require('@actions/core')
const exec = require('@actions/exec')
const io = require('@actions/io')
const os = require('os')
const download = require('download-file')

const WINDOWS_ARCHIVE_URL = "https://github.com/aloucks/vk-test/releases/download/untagged-ce7d44b1006ecbe7b4d4/vk-ci-windows-amd64.zip";
const WINDOWS_ARCHIVE_FILENAME = "vk-ci-windows-amd64.zip";

const LINUX_ARCHIVE_FILENAME = "vk-ci-linux-amd64.tar.gz";
const LINUX_ARCHIVE_URL = "https://github.com/aloucks/vk-test/releases/download/untagged-ce7d44b1006ecbe7b4d4/vk-ci-linux-amd64.tar.gz";
const LINUX_LIBS = [
    "vulkan/libvulkan.so",
    "vulkan/libvulkan.so.1",
    "vulkan/libvulkan...",
    "vulkan/driver/libvk_swiftshader.so",
    "vulkan/layers/libVkLayer_khronos_validation.so"
];


const MACOS_ARCHIVE_FILENAME = "vk-ci-linux-amd64.tar.gz";
const MACOS_ARCHIVE_URL = "https://github.com/aloucks/vk-test/releases/download/untagged-ce7d44b1006ecbe7b4d4/vk-ci-macos-amd64.tar.gz";
const MACOS_LIBS = [
    "vulkan/libvulkan.dylib",
    "vulkan/libvulkan.dylib.1",
    "vulkan/libvulkan....dylib",
    "vulkan/driver/libvk_swiftshader.dylib",
    "vulkan/layers/libVkLayer_khronos_validation.dylib"    
]

try {
    core.exportVariable("SWIFTSHADER_DISABLE_DEBUGGER_WAIT_DIALOG", "1");

    if (process.platform == "win32") {
        downloadAndInstallWindows(WINDOWS_ARCHIVE_URL, WINDOWS_ARCHIVE_FILENAME);
    } else if (process.platform == "linux") {
        downloadAndInstall(LINUX_ARCHIVE_URL, LINUX_ARCHIVE_FILENAME, LINUX_LIBS);
    } else if (process.platform == "darwin") {
        downloadAndInstall(MACOS_ARCHIVE_URL, MACOS_ARCHIVE_FILENAME, MACOS_LIBS);
    } else {
        core.setFailed("unsupported platform: " + process.platform);
    }
} catch (error) {
    core.setFailed(error.message)
}

function downloadAndInstall(archive_url, archive_filename, libraries) {    
    let tmpDir = os.tmpdir();
    download(archive_url, { directory: tmpDir }, function(err) {
        if (err) throw err;
        if (0 != await exec.exec("tar zvxf " + archive_filename, {"cwd": tmpDir})) {
            throw "failed to decompress: " + archive_filename
        }
        for (filename in libraries) {
            await io.mv(tmpDir + filename, "/usr/local/lib/");
        }
        await io.mkdirP("/usr/local/share/vulkan/explicit_layer.d");
        await io.mkdirP("/usr/local/share/vulkan/icd.d");
        await io.mv(tmpDir + "/vulkan/layers/VkLayer_khronos_validation.json", "/usr/local/share/vulkan/explicit_layer.d/VkLayer_khronos_validation.json");
        await io.mv(tmpDir + "/vulkan/drivers/vk_swiftshader_icd.json", "/usr/local/share/vulkan/icd.d/vk_swiftshader_icd.json"); 
    });
}

function downloadAndInstallWindows(archive_url, archive_filename) {    
    let tmpDir = os.tmpdir();
    download(archive_url, { directory: tmpDir }, function(err) {
        if (err) throw err;
        if (0 != await exec.exec("7z x -y " + archive_filename, {"cwd": tmpDir})) {
            throw "failed to decompress: " + archive_filename
        }
        core.addPath(tmpDir + "\\vulkan");
        core.exportVariable("VK_ICD_FILENAMES", tmpDir + "\\vulkan\\driver\\vk_swiftshader_icd.json");
        core.exportVariable("VK_LAYER_PATH", tmpDir + "\\vulkan\\layers");
    });
}