Pod::Spec.new do |s|
  s.name           = 'WordWidget'
  s.version        = '0.1.0'
  s.summary        = 'Feeds the Kalima home-screen widget'
  s.description    = 'Writes the word deck into the shared App Group and reloads the widget timelines.'
  s.author         = ''
  s.homepage       = 'https://kalima.app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
