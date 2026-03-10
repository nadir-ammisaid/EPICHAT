type ServerPageProps = {
    params: {
        serverId: string;
    };
};

export default function ServerPage({ params }: ServerPageProps) {
    return (
        <main>
            <h1>Server: {params.serverId}</h1>
        </main>
    );
}