package leyans.RidersHub;

import io.github.cdimascio.dotenv.Dotenv;
import leyans.RidersHub.Config.JWT.JwtConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(JwtConfig.class)
@EnableCaching
public class RidersHubApplication {

	static {
		Dotenv dotenv = Dotenv.configure()
				.directory("./backend")  // Adjust path if needed
				.ignoreIfMissing()
				.load();

		dotenv.entries().forEach(entry ->
				System.setProperty(entry.getKey(), entry.getValue())
		);
	}

	public static void main(String[] args) {
		SpringApplication.run(RidersHubApplication.class, args);
	}
}
